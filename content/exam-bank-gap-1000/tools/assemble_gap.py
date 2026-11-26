#!/usr/bin/env python3
"""Assemble per-bank additions.json from validated gap-build batches."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "gap_config.json").read_text())

def main():
    keys = sys.argv[1:] or list(CFG)
    total = 0
    for key in keys:
        c = CFG[key]
        d = ROOT / key
        items = []
        for b in c["batches"]:
            f = d / f"batch-{b['batch']}.json"
            if f.exists():
                items += json.loads(f.read_text())
        items.sort(key=lambda x: x["questionNum"])
        (d / "additions.json").write_text(json.dumps(items, indent=1, ensure_ascii=False))
        total += len(items)
        print(f"{key}: additions.json {len(items)} items")
    print("TOTAL:", total)

if __name__ == "__main__":
    main()
