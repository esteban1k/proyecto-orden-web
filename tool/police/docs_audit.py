#!/usr/bin/env python3
"""Police Docs: per-commit check that repo docs moved when the change required it.

Prints markdown findings to stdout. Empty stdout means nothing to comment.
Each finding starts with an HTML marker <!-- police:blocker|warning|nice -->.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def git(repo: Path, *args: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(repo), *args],
        check=True,
        text=True,
        capture_output=True,
    )
    return proc.stdout


def name_status(repo: Path, sha: str) -> list[tuple[str, str]]:
    out = git(repo, "diff-tree", "--root", "--no-commit-id", "--name-status", "-r", "-m", "--first-parent", sha)
    rows: list[tuple[str, str]] = []
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            rows.append((parts[0], parts[-1]))
    return rows


def subject(repo: Path, sha: str) -> str:
    return git(repo, "log", "-1", "--format=%s", sha).strip()


def parents(repo: Path, sha: str) -> list[str]:
    raw = git(repo, "rev-list", "--parents", "-n", "1", sha).strip().split()
    return raw[1:]


def show_file(repo: Path, sha: str, path: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(repo), "show", "--unified=0", "--format=", sha, "--", path],
        text=True,
        capture_output=True,
    )
    return proc.stdout


def is_doc(profile: str, path: str) -> bool:
    if profile == "app":
        return path in {"README.md", "CHANGELOG.md", "CHANGELOG", "patrol_test/README.md", "coverage_baselines/README.md"} or path.startswith("docs/")
    if profile == "web":
        return path == "README.md" or path.startswith("docs/")
    if profile == "qa":
        return path == "README.md" or path.startswith("docs/")
    raise SystemExit(f"unknown profile {profile}")


def expects_docs(profile: str, path: str) -> bool:
    if profile == "app":
        return (
            path.startswith("lib/")
            or path.startswith("assets/")
            or path.startswith("android/app/src/")
            or path.startswith("ios/Runner/")
            or path == "pubspec.yaml"
        )
    if profile == "web":
        return path in {"index.html", "CNAME", "sitemap.xml", "robots.txt"} or path.startswith("privacidad/") or path.startswith("assets/")
    if profile == "qa":
        return path.startswith("skills/") or path.startswith("agents/")
    return False


def version_bumped(repo: Path, sha: str, files: list[tuple[str, str]]) -> bool:
    if not any(path == "pubspec.yaml" for _, path in files):
        return False
    diff = show_file(repo, sha, "pubspec.yaml")
    return any(line.startswith("+version:") or line.startswith("+ version:") for line in diff.splitlines())


def finding(severity: str, sha: str, text: str) -> str:
    short = sha[:7]
    return f"<!-- police:{severity} -->\n- **{severity}** · `{short}` · {text}\n"


def audit_commit(repo: Path, profile: str, sha: str) -> list[str]:
    rows = name_status(repo, sha)
    paths = [path for _, path in rows]
    added = {path for status, path in rows if status.startswith("A")}
    out: list[str] = []
    if len(parents(repo, sha)) > 1:
        out.append(finding("warning", sha, "commit de merge en la rama de trabajo. Police no mergea a main."))

    docs = [path for path in paths if is_doc(profile, path)]
    code = [path for path in paths if expects_docs(profile, path)]
    if not code:
        return out

    sensitive = False
    why = ""
    if profile == "app" and version_bumped(repo, sha, rows):
        sensitive = True
        why = "`pubspec.yaml` cambia `version:`"
    if profile == "app" and any(path.endswith("AndroidManifest.xml") or path.endswith("Info.plist") for path in code):
        sensitive = True
        why = why or "cambia manifiesto Android o Info.plist"
    if profile == "web" and any(path.startswith("privacidad/") for path in code):
        sensitive = True
        why = "cambia la página de privacidad"
    if profile == "qa" and any(path.startswith("skills/") and path.endswith("/SKILL.md") for path in added):
        sensitive = True
        why = "agrega un skill nuevo"

    sample = ", ".join(f"`{path}`" for path in code[:4])
    if len(code) > 4:
        sample += f" (+{len(code) - 4})"

    if sensitive and not docs:
        out.append(finding("blocker", sha, f"{why} y este commit no toca documentación del repo ({sample})."))
        return out
    only_assets = profile == "web" and all(path.startswith("assets/") for path in code)
    if only_assets and not docs:
        out.append(finding("nice", sha, f"solo assets ({sample}) y este commit no toca el README."))
        return out
    if code and not docs:
        out.append(finding("warning", sha, f"cambia producto ({sample}) y este commit no toca documentación del repo."))
        return out
    if code and docs and "README.md" not in paths:
        out.append(finding("nice", sha, f"hay docs, pero `README.md` no entra en el commit ({sample})."))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True, choices=("app", "web", "qa"))
    ap.add_argument("--repo", type=Path, default=Path("."))
    ap.add_argument("--commits-file", type=Path, required=True)
    args = ap.parse_args()
    shas = [line.strip() for line in args.commits_file.read_text().splitlines() if line.strip()]
    chunks: list[str] = []
    for sha in shas:
        chunks.extend(audit_commit(args.repo, args.profile, sha))
    sys.stdout.write("".join(chunks))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
