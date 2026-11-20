#!/usr/bin/env python3
"""Police Preflight for proyecto-qa: skill folders stay atomic and declared."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def finding(severity: str, text: str) -> str:
    return f"<!-- police:{severity} -->\n- **{severity}** · {text}\n"


def frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---", 4)
    if end < 0:
        return {}
    block = text[4:end]
    data: dict[str, str] = {}
    for line in block.splitlines():
        if ":" in line and not line.startswith(" "):
            key, value = line.split(":", 1)
            data[key.strip()] = value.strip()
    return data


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path("."))
    args = ap.parse_args()
    chunks: list[str] = []
    skills = args.root / "skills"
    if not skills.is_dir():
        chunks.append(finding("blocker", "falta el directorio `skills/`."))
    else:
        for folder in sorted(
            path for path in skills.iterdir() if path.is_dir() and not path.name.startswith("_")
        ):
            skill = folder / "SKILL.md"
            if not skill.exists():
                chunks.append(finding("blocker", f"`skills/{folder.name}/` no tiene `SKILL.md`."))
                continue
            text = skill.read_text(encoding="utf-8")
            meta = frontmatter(text)
            if "name" not in meta or "description" not in meta:
                chunks.append(finding("blocker", f"`skills/{folder.name}/SKILL.md` no declara `name` y `description`."))
            elif meta.get("name") and meta["name"] != folder.name:
                chunks.append(finding("warning", f"`skills/{folder.name}` declara name `{meta['name']}`. El folder y el name no coinciden."))
            if len(text.splitlines()) < 8:
                chunks.append(finding("nice", f"`skills/{folder.name}/SKILL.md` es muy corto para un skill atómico."))
    agents = args.root / "agents"
    if not agents.is_dir():
        chunks.append(finding("blocker", "falta el directorio `agents/`."))
    else:
        files = list(agents.glob("*.md"))
        if not files:
            chunks.append(finding("blocker", "`agents/` no tiene markdown."))
        for agent in files:
            if not agent.read_text(encoding="utf-8").strip():
                chunks.append(finding("blocker", f"`agents/{agent.name}` está vacío."))
    sys.stdout.write("".join(chunks))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
