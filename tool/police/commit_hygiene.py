#!/usr/bin/env python3
"""Police Preflight: subject and branch hygiene. Does not judge product quality."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

WEAK = re.compile(r"^(wip|tmp|asdf|fix|update|changes|commit)\.?$", re.IGNORECASE)


def git(repo: Path, *args: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(repo), *args],
        check=True,
        text=True,
        capture_output=True,
    )
    return proc.stdout


def finding(severity: str, sha: str, text: str) -> str:
    return f"<!-- police:{severity} -->\n- **{severity}** · `{sha[:7]}` · {text}\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", type=Path, default=Path("."))
    ap.add_argument("--commits-file", type=Path, required=True)
    ap.add_argument("--branch", default="")
    args = ap.parse_args()
    chunks: list[str] = []
    if args.branch in {"main", "master"}:
        chunks.append("<!-- police:blocker -->\n- **blocker** · rama `main`/`master`. El trabajo no se pushea a main.\n")
    shas = [line.strip() for line in args.commits_file.read_text().splitlines() if line.strip()]
    for sha in shas:
        title = git(args.repo, "log", "-1", "--format=%s", sha).strip()
        if not title:
            chunks.append(finding("blocker", sha, "commit sin asunto."))
        elif WEAK.match(title):
            chunks.append(finding("warning", sha, f"asunto débil: `{title}`."))
        body = git(args.repo, "log", "-1", "--format=%b", sha)
        if "Co-authored-by:" in body and "noreply" not in body:
            chunks.append(finding("nice", sha, "el cuerpo trae Co-authored-by; confirmá que el trailer es intencional."))
    sys.stdout.write("".join(chunks))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
