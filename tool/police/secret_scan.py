#!/usr/bin/env python3
"""Police Preflight: scan added lines and new filenames in a commit list."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"ghp_[A-Za-z0-9]{20,}"), "GitHub PAT"),
    (re.compile(r"github_pat_[A-Za-z0-9_]{20,}"), "GitHub fine-grained PAT"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key"),
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"), "private key"),
    (re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"), "Slack token"),
]

BAD_SUFFIXES = (".jks", ".keystore", ".p12", ".pfx", ".pem")
BAD_NAMES = {
    "google-services.json",
    "GoogleService-Info.plist",
    "id_rsa",
    "id_dsa",
    "id_ecdsa",
    "id_ed25519",
}


def git(repo: Path, *args: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(repo), *args],
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr)
        raise SystemExit(proc.returncode)
    return proc.stdout


def finding(severity: str, sha: str, text: str) -> str:
    return f"<!-- police:{severity} -->\n- **{severity}** · `{sha[:7]}` · {text}\n"


def bad_filename(path: str) -> str | None:
    name = Path(path).name
    if name in BAD_NAMES or name.endswith(BAD_SUFFIXES):
        return name
    if name == ".env" or (name.startswith(".env.") and not name.endswith(".example")):
        return name
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", type=Path, default=Path("."))
    ap.add_argument("--commits-file", type=Path, required=True)
    args = ap.parse_args()
    shas = [line.strip() for line in args.commits_file.read_text().splitlines() if line.strip()]
    chunks: list[str] = []
    for sha in shas:
        names = git(args.repo, "diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "-m", "--first-parent", sha)
        for path in names.splitlines():
            hit = bad_filename(path)
            if hit:
                chunks.append(finding("blocker", sha, f"archivo sensible en el commit: `{path}`."))
        diff = git(args.repo, "show", "--format=", "--unified=0", sha)
        for line in diff.splitlines():
            if not line.startswith("+") or line.startswith("+++"):
                continue
            for pattern, label in PATTERNS:
                if pattern.search(line[1:]):
                    chunks.append(finding("blocker", sha, f"posible secreto ({label}) en una línea agregada."))
                    break
    sys.stdout.write("".join(chunks))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
