#!/usr/bin/env python3
"""Duplicate screening for the exam-bank expansion.

Method:
- Normalize each stem (lowercase, punctuation stripped, whitespace collapsed).
- Exact duplicate: identical normalized stem, checked new-vs-existing bank and
  within the new set (and, for the OIT wastewater bank, across the oit and
  oit-ww addition sets, which target the same bank file).
- Near duplicate: numbers masked to '#', token-set Jaccard similarity >= 0.85
  between a new stem and any existing-bank stem, or between two new stems.
- Calculation duplicate: identical normalized expression string within the
  new set, or vs an existing bank's expression/calculationExpression fields.

Usage: dedup.py [courseKey ...]  (default: all)
Writes tools/dedup-report.json and prints a summary.
"""
import json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from courses_data import COURSES

ROOT = Path.home() / "workspace/echelon/exam-bank-expansion"
BANKS = Path.home() / "workspace/echelon-ai-tutor/content"
CFG = {c["key"]: c for c in COURSES}

def norm(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9# ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def masked(s):
    return norm(re.sub(r"\d+(?:\.\d+)?", "#", s))

def jaccard(a, b):
    sa, sb = set(a.split()), set(b.split())
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)

def load_new(key):
    items = []
    d = ROOT / key
    for b in (1, 2, 3, 4):
        f = d / f"batch-{b}.json"
        if f.exists():
            items += json.loads(f.read_text())
    return items

def load_existing(course):
    items = []
    for rel in course["dedup"]:
        p = BANKS / rel
        if p.exists():
            items += json.loads(p.read_text())
    return items

def main():
    keys = sys.argv[1:] or list(CFG)
    report = {}
    # cross-set pool for the shared OIT wastewater bank
    ww_pool = []
    for k in ("oit", "oit-ww"):
        for it in load_new(k):
            if it.get("stream") == "Wastewater Treatment" or k == "oit-ww":
                ww_pool.append((k, it))
    for key in keys:
        c = CFG[key]
        new = load_new(key)
        existing = load_existing(c)
        ex_norm = {norm(x["question"]) for x in existing}
        ex_masked = [(masked(x["question"]), x["question"]) for x in existing]
        ex_expr = set()
        for x in existing:
            for f in ("expression", "calculationExpression"):
                if x.get(f):
                    ex_expr.add(re.sub(r"\s+", "", str(x[f])))
        exact, near, expr_dups = [], [], []
        seen_norm, seen_masked, seen_expr = {}, {}, {}
        for it in new:
            q = it["question"]
            n, m = norm(q), masked(q)
            ref = it.get("itemId") or str(it.get("questionNum"))
            if n in ex_norm:
                exact.append(f"{ref}: exact match vs existing bank: {q[:80]}")
            if n in seen_norm:
                exact.append(f"{ref}: exact duplicate of new item {seen_norm[n]}")
            seen_norm[n] = ref
            if m in seen_masked:
                near.append(f"{ref}: masked-stem duplicate of new item {seen_masked[m]}: {q[:80]}")
            seen_masked[m] = ref
            for em, eq in ex_masked:
                if jaccard(m, em) >= 0.85:
                    near.append(f"{ref}: near-dup vs existing bank (J>=0.85): {q[:60]} || {eq[:60]}")
                    break
            expr = None
            for f in ("expression", "calculationExpression"):
                if it.get(f):
                    expr = re.sub(r"\s+", "", str(it[f]))
            if expr:
                if expr in ex_expr:
                    expr_dups.append(f"{ref}: expression duplicates existing bank: {expr}")
                if expr in seen_expr:
                    expr_dups.append(f"{ref}: expression duplicates new item {seen_expr[expr]}: {expr}")
                seen_expr[expr] = ref
        cross = []
        if key in ("oit", "oit-ww"):
            mine = [(key, it) for it in new if it.get("stream") == "Wastewater Treatment" or key == "oit-ww"]
            my_norm = {norm(it["question"]) for _, it in mine}
            for k2, it2 in ww_pool:
                if k2 != key and norm(it2["question"]) in my_norm:
                    cross.append(f"cross-set exact dup with {k2}: {it2['question'][:80]}")
        report[key] = {"new_items": len(new), "existing_bank_items": len(existing),
                       "exact": exact, "near": near, "expression_dups": expr_dups, "cross": cross}
        print(f"{key}: {len(new)} new vs {len(existing)} existing | exact {len(exact)}, near {len(near)}, expr {len(expr_dups)}, cross {len(cross)}")
        for label, lst in (("EXACT", exact), ("NEAR", near), ("EXPR", expr_dups), ("CROSS", cross)):
            for x in lst[:12]:
                print(f"  {label}", x)
    (Path(__file__).parent / "dedup-report.json").write_text(json.dumps(report, indent=1))
    bad = sum(len(r["exact"]) + len(r["expression_dups"]) + len(r["cross"]) for r in report.values())
    print("TOTAL hard duplicates:", bad)
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
