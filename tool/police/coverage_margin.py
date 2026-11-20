#!/usr/bin/env python3
"""If unit coverage passed and sits under 1 point above the floor, emit a nice-to-have."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--log", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    text = args.log.read_text(errors="replace") if args.log.exists() else ""
    pct = re.search(r"unit_coverage_pct=([0-9.]+)", text)
    floor = re.search(r"floor_pct=([0-9.]+)", text)
    if not pct or not floor:
        return 0
    gap = float(pct.group(1)) - float(floor.group(1))
    if gap < 1:
        with args.out.open("a") as fh:
            fh.write(
                "<!-- police:nice -->\n"
                f"- **nice to have** · cobertura unitaria {pct.group(1)}% queda a menos de 1 punto del piso {floor.group(1)}%.\n"
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())