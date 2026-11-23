#!/usr/bin/env python3
"""Exact-rational verification of every calculation item in the expansion.

For each batch verify record: safely evaluate the expression with Fraction
arithmetic, round half-up to decimalPlaces, and compare with the record's
expected value. Cross-check the in-item fields per schema variant and the
item's correctAnswer text.

Usage: verify_calcs.py [courseKey ...]  (default: all courses)
Writes tools/calc-verification-report.json and prints a summary.
"""
import json, re, sys
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from courses_data import COURSES

ROOT = Path.home() / "workspace/echelon/exam-bank-expansion"
CFG = {c["key"]: c for c in COURSES}
TOKEN = re.compile(r"\d+(?:\.\d+)?|[()+\-*/]")

def eval_expr(expr):
    toks = TOKEN.findall(expr)
    if "".join(toks).replace(" ", "") != expr.replace(" ", ""):
        raise ValueError(f"unsafe characters in expression: {expr!r}")
    pos = 0
    def peek():
        return toks[pos] if pos < len(toks) else None
    def parse_expr():
        nonlocal pos
        v = parse_term()
        while peek() in ("+", "-"):
            op = toks[pos]; pos += 1
            r = parse_term()
            v = v + r if op == "+" else v - r
        return v
    def parse_term():
        nonlocal pos
        v = parse_factor()
        while peek() in ("*", "/"):
            op = toks[pos]; pos += 1
            r = parse_factor()
            v = v * r if op == "*" else v / r
        return v
    def parse_factor():
        nonlocal pos
        t = toks[pos]
        if t == "(":
            pos += 1
            v = parse_expr()
            assert toks[pos] == ")"
            pos += 1
            return v
        if t == "-":
            pos += 1
            return -parse_factor()
        pos += 1
        return Fraction(Decimal(t))
    v = parse_expr()
    if pos != len(toks):
        raise ValueError("trailing tokens")
    return v

def round_frac(fr, places):
    d = Decimal(fr.numerator) / Decimal(fr.denominator)
    return d.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)

def main():
    keys = sys.argv[1:] or list(CFG)
    report = {}
    total = bad = 0
    for key in keys:
        c = CFG[key]
        d = ROOT / key
        problems = []
        checked = 0
        for b in (1, 2, 3, 4):
            bf, vf = d / f"batch-{b}.json", d / f"batch-{b}.verify.json"
            if not bf.exists() or not vf.exists():
                continue
            items = json.loads(bf.read_text())
            recs = json.loads(vf.read_text())
            calc_items = [it for it in items if it.get("isCalc") == "yes"]
            by_ref = {}
            for it in calc_items:
                ref = it.get("itemId") or str(it.get("questionNum"))
                by_ref[ref] = it
            for rec in recs:
                checked += 1
                ref = str(rec.get("itemId"))
                try:
                    exact = eval_expr(rec["expression"])
                    rounded = round_frac(exact, int(rec["decimalPlaces"]))
                    if Decimal(str(rec["expected"])) != rounded:
                        problems.append(f"b{b} {ref}: expression gives {rounded}, record says {rec['expected']}")
                        continue
                except Exception as e:
                    problems.append(f"b{b} {ref}: expression error: {e}")
                    continue
                it = by_ref.get(ref)
                if it is None:
                    problems.append(f"b{b} {ref}: verify record has no matching calc item")
                    continue
                exp_str = str(rec["expected"])
                if c["variant"] == "treat":
                    if it.get("expression") != rec["expression"]:
                        problems.append(f"b{b} {ref}: item expression != verify expression")
                    if str(it.get("expected")) != exp_str:
                        problems.append(f"b{b} {ref}: item expected {it.get('expected')} != {exp_str}")
                    if it.get("decimalPlaces") != rec["decimalPlaces"] or it.get("unit") != rec["unit"]:
                        problems.append(f"b{b} {ref}: item decimalPlaces/unit mismatch")
                elif c["variant"] == "net":
                    if it.get("calculationExpression") != rec["expression"]:
                        problems.append(f"b{b} {ref}: item calculationExpression != verify expression")
                    if it.get("decimalPlaces") != rec["decimalPlaces"] or it.get("unit") != rec["unit"]:
                        problems.append(f"b{b} {ref}: item decimalPlaces/unit mismatch")
                elif c["variant"] == "cand":
                    cc = it.get("calculationCheck") or {}
                    if cc.get("decimals") != rec["decimalPlaces"] or cc.get("unit") != rec["unit"]:
                        problems.append(f"b{b} {ref}: calculationCheck decimals/unit mismatch")
                    elif abs(Decimal(str(cc.get("value"))) - (Decimal(exact.numerator) / Decimal(exact.denominator))) > Decimal("0.001"):
                        problems.append(f"b{b} {ref}: calculationCheck value {cc.get('value')} disagrees with exact {float(exact):.6f}")
                ca = str(it.get("correctAnswer") or (it.get("options", [""] * 4)[it.get("correctIndex", 0)] if it.get("options") else ""))
                if exp_str not in ca:
                    problems.append(f"b{b} {ref}: correctAnswer {ca!r} does not contain expected {exp_str}")
        report[key] = {"checked": checked, "problems": problems}
        total += checked; bad += len(problems)
        print(f"{key}: {checked} calc records checked, {len(problems)} problems")
        for p in problems:
            print("  FAIL", p)
    (Path(__file__).parent / "calc-verification-report.json").write_text(json.dumps(report, indent=1))
    print(f"TOTAL: {total} calc records, {bad} problems")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
