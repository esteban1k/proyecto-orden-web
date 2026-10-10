#!/usr/bin/env python3
"""Post one PR comment when Police found something. Exit 1 if any blocker."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

MAX = 60000


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", required=True)
    ap.add_argument("--file", type=Path, required=True)
    ap.add_argument("--pr", required=True)
    args = ap.parse_args()
    raw = args.file.read_text() if args.file.exists() else ""
    body_in = raw.strip()
    if not body_in:
        print(f"{args.name}: sin hallazgos, no comenta.")
        return 0
    blocker = "<!-- police:blocker -->" in body_in
    warning = "<!-- police:warning -->" in body_in
    nice = "<!-- police:nice -->" in body_in
    counts = []
    if blocker:
        counts.append("blocker")
    if warning:
        counts.append("warning")
    if nice:
        counts.append("nice to have")
    summary = ", ".join(counts) if counts else "hallazgos"
    text = f"**{args.name}**\n\nClasificación: {summary}.\n\n{body_in}\n"
    if len(text) > MAX:
        text = text[:MAX] + "\n\n…recortado. El log completo está en el job de Actions.\n"
    path = args.file.with_suffix(".comment.md")
    path.write_text(text)
    if not os.environ.get("GH_TOKEN") and not os.environ.get("GITHUB_TOKEN"):
        print(text)
        print("sin GH_TOKEN: comentario no enviado", file=sys.stderr)
        return 1 if blocker else 0
    subprocess.run(
        ["gh", "pr", "comment", args.pr, "--body-file", str(path)],
        check=True,
    )
    print(f"{args.name}: comentario publicado en PR #{args.pr}")
    return 1 if blocker else 0


if __name__ == "__main__":
    raise SystemExit(main())
