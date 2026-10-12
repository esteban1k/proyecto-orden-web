#!/usr/bin/env python3
"""Police Preflight for the static site: UTF-8, title, and a closed html document."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def finding(severity: str, text: str) -> str:
    return f"<!-- police:{severity} -->\n- **{severity}** · {text}\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path("."))
    args = ap.parse_args()
    pages = [args.root / "index.html", *sorted((args.root / "privacidad").glob("**/*.html"))]
    chunks: list[str] = []
    for page in pages:
        rel = page.relative_to(args.root)
        if not page.exists():
            chunks.append(finding("blocker", f"falta `{rel}`."))
            continue
        try:
            text = page.read_text(encoding="utf-8")
        except UnicodeError:
            chunks.append(finding("blocker", f"`{rel}` no es UTF-8."))
            continue
        if not text.strip():
            chunks.append(finding("blocker", f"`{rel}` está vacío."))
            continue
        lower = text.lower()
        if "<title>" not in lower or "</title>" not in lower:
            chunks.append(finding("warning", f"`{rel}` no tiene `<title>`."))
        if "</html>" not in lower:
            chunks.append(finding("warning", f"`{rel}` no cierra `</html>`."))
        if "charset" not in lower:
            chunks.append(finding("nice", f"`{rel}` no declara charset."))
    sys.stdout.write("".join(chunks))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
