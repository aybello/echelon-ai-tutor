#!/usr/bin/env python3
"""Assemble per-course addition files from validated batches.

oit produces additions-water.json + additions-wastewater.json (its 200 split
across two bank files). Every other course produces additions.json. oit-ww
produces additions-wastewater.json (all 200 target the wastewater bank).
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from courses_data import COURSES

ROOT = Path.home() / "workspace/echelon/exam-bank-expansion"

def main():
    keys = sys.argv[1:] or [c["key"] for c in COURSES]
    for c in COURSES:
        if c["key"] not in keys:
            continue
        d = ROOT / c["key"]
        items = []
        for b in (1, 2, 3, 4):
            f = d / f"batch-{b}.json"
            if f.exists():
                items += json.loads(f.read_text())
        if c["key"] == "oit":
            water = sorted([x for x in items if x["stream"] == "Water Treatment"], key=lambda x: x["questionNum"])
            ww = sorted([x for x in items if x["stream"] == "Wastewater Treatment"], key=lambda x: x["questionNum"])
            (d / "additions-water.json").write_text(json.dumps(water, indent=1, ensure_ascii=False))
            (d / "additions-wastewater.json").write_text(json.dumps(ww, indent=1, ensure_ascii=False))
            print(f"oit: additions-water.json {len(water)}, additions-wastewater.json {len(ww)}")
        elif c["key"] == "oit-ww":
            items.sort(key=lambda x: x["questionNum"])
            (d / "additions-wastewater.json").write_text(json.dumps(items, indent=1, ensure_ascii=False))
            print(f"oit-ww: additions-wastewater.json {len(items)}")
        else:
            items.sort(key=lambda x: x["questionNum"])
            (d / "additions.json").write_text(json.dumps(items, indent=1, ensure_ascii=False))
            print(f"{c['key']}: additions.json {len(items)}")

if __name__ == "__main__":
    main()
