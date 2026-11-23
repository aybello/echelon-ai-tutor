#!/usr/bin/env python3
"""Verification of every calculation item in the gap build.

Checks actually performed (this is the complete list; the per-bank report
carries the same list under "checksPerformed"):

1. Expression recomputation in exact rational arithmetic: each verify
   record's expression is safely evaluated with Fraction arithmetic,
   rounded half-up to the record's decimalPlaces, and the result must
   equal the record's expected value exactly.
2. Exactly one verification record per calculation item: a calculation
   item with no record, an itemId with two or more records, and a record
   with no matching calculation item are all problems.
3. Item and record field consistency per schema variant: for the treat
   variant the item's expression, expected, decimalPlaces and unit must
   equal the record's; for the net variant the item's
   calculationExpression, decimalPlaces and unit must equal the record's;
   for the cand variant the item's calculationCheck decimals and unit
   must equal the record's and its value must agree with the exact
   expression value within 0.001.
4. correctAnswer exact numeric and unit match: the item's correctAnswer
   is parsed into a numeric value and a unit text. The numeric value, as
   a Decimal, must equal the record's expected value exactly, and the
   unit text must equal the record's unit exactly. The only normalization
   is surrounding whitespace and the separator between value and unit:
   the unit may be attached to the value with no space, and a leading
   currency symbol counts as part of the unit (so a value written with a
   leading "$" can match a record unit of "$", "$/km" or "$/m3" style, or
   a trailing currency code). A bare number with no unit text is accepted
   only when the record unit is one of the unitless descriptors
   "dimensionless" or "dilution factor". A correctAnswer that cannot be
   parsed into a numeric value and a unit is a problem, not a pass. No
   substring matching is used anywhere in this check.
5. Treat variant steps check: the item's steps JSON must contain
   Relationship, Substitution and Result entries, and the Result entry
   must contain the expected numeric value as a standalone number token
   equal to the expected Decimal. The Substitution entry's arithmetic is
   NOT recomputed; no claim about it is made.

Usage: verify_calcs_gap.py [courseKey ...]  (default: all)
Writes tools/calc-verification-report.json and prints a summary. Each
bank entry carries the shared report envelope ("checker",
"checkerSha256", "configSha256", "payloadDigest") plus "checked",
"problems" and "checksPerformed". A run with explicit bank arguments
merges: it updates only those banks in the existing report file. A run
with no arguments recomputes every bank.
Exit 1 if any problems.
"""
import hashlib, json, re, sys
from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "gap_config.json").read_text())
REPORT = Path(__file__).resolve().parent / "calc-verification-report.json"
CHECKER = Path(__file__).name
TOKEN = re.compile(r"\d+(?:\.\d+)?|[()+\-*/]")
CA_RE = re.compile(r"^\s*(\$)?\s*(-?\d[\d,]*(?:\.\d+)?)\s*(.*?)\s*$", re.S)
NUM_TOKEN = re.compile(r"-?\d[\d,]*(?:\.\d+)?")
UNITLESS_UNITS = {"dimensionless", "dilution factor"}

CHECKS_PERFORMED = [
    "expression recomputation in exact rational arithmetic",
    "exactly-one-record enforcement",
    "item/record field consistency",
    "correctAnswer exact numeric and unit match",
    "result-step value match (treat variant steps: Relationship, Substitution and Result entries required; Result entry must contain the expected value as a standalone number token)",
]

def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()

def sha_file(p):
    return sha_bytes(Path(p).read_bytes())

def canon(it):
    return json.dumps(it, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def payload_digest(items):
    hashes = [sha_bytes(canon(it)) for it in sorted(items, key=lambda x: x["questionNum"])]
    return sha_bytes("".join(hashes).encode("utf-8"))

def envelope(items):
    return {"checker": CHECKER,
            "checkerSha256": sha_file(Path(__file__).resolve()),
            "configSha256": sha_file(ROOT / "gap_config.json"),
            "payloadDigest": payload_digest(items)}

def merge_report(updates):
    existing = {}
    if REPORT.exists():
        try:
            loaded = json.loads(REPORT.read_text())
            if isinstance(loaded, dict):
                existing = loaded
        except Exception:
            existing = {}
    existing.update(updates)
    REPORT.write_text(json.dumps(existing, indent=1))

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

def parse_correct_answer(ca):
    """Parse correctAnswer text into (Decimal value, set of exact unit
    candidate strings, unit text found). Returns None if the text cannot
    be parsed into a numeric value plus unit text."""
    if not isinstance(ca, str):
        return None
    m = CA_RE.match(ca)
    if not m:
        return None
    prefix = m.group(1) or ""
    try:
        value = Decimal(m.group(2).replace(",", ""))
    except Exception:
        return None
    rest = m.group(3) or ""
    candidates = {rest}
    if prefix == "$":
        if rest == "":
            candidates.add("$")
        elif rest.startswith("/"):
            candidates.add("$" + rest)
        elif rest.startswith("per "):
            candidates.add("$/" + rest[4:])
    return value, candidates, rest

def check_correct_answer(it, rec, bn, ref, problems):
    ca = it.get("correctAnswer")
    if ca is None:
        opts = it.get("options") or []
        ci = it.get("correctIndex")
        ca = opts[ci] if ci in (0, 1, 2, 3) and len(opts) == 4 else ""
    parsed = parse_correct_answer(ca)
    if parsed is None:
        problems.append(f"b{bn} {ref}: correctAnswer {ca!r} cannot be parsed into a numeric value and a unit")
        return
    value, candidates, rest = parsed
    try:
        expected = Decimal(str(rec["expected"]))
    except Exception:
        problems.append(f"b{bn} {ref}: verify record expected {rec.get('expected')!r} is not numeric")
        return
    if value != expected:
        problems.append(f"b{bn} {ref}: correctAnswer value {value} != expected {expected}")
    unit = str(rec.get("unit"))
    if unit in candidates:
        return
    if rest == "" and unit in UNITLESS_UNITS:
        return
    problems.append(f"b{bn} {ref}: correctAnswer unit {rest!r} != record unit {unit!r} (correctAnswer {ca!r})")

def check_steps(it, rec, bn, ref, problems):
    raw = it.get("steps")
    if not raw:
        problems.append(f"b{bn} {ref}: calc item has no steps")
        return
    try:
        st = json.loads(raw)
        assert isinstance(st, list)
    except Exception:
        problems.append(f"b{bn} {ref}: steps is not valid JSON")
        return
    labels = [e.get("l") for e in st if isinstance(e, dict)]
    for need in ("Relationship", "Substitution", "Result"):
        if need not in labels:
            problems.append(f"b{bn} {ref}: steps missing {need} entry")
    results = [str(e.get("c", "")) for e in st if isinstance(e, dict) and e.get("l") == "Result"]
    if results:
        try:
            expected = Decimal(str(rec["expected"]))
        except Exception:
            return
        found = False
        for tok in NUM_TOKEN.findall(results[0]):
            try:
                if Decimal(tok.replace(",", "")) == expected:
                    found = True
                    break
            except Exception:
                continue
        if not found:
            problems.append(f"b{bn} {ref}: steps Result entry {results[0]!r} does not contain expected value {expected} as a standalone number token")

def main():
    keys = sys.argv[1:] or list(CFG)
    updates = {}
    total = bad = 0
    for key in keys:
        c = CFG[key]
        d = ROOT / key
        problems = []
        checked = 0
        all_items = []
        for b in c["batches"]:
            bn = b["batch"]
            bf, vf = d / f"batch-{bn}.json", d / f"batch-{bn}.verify.json"
            if not bf.exists() or not vf.exists():
                if bf.exists():
                    try:
                        all_items += json.loads(bf.read_text())
                    except Exception:
                        pass
                problems.append(f"b{bn}: batch or verify file missing")
                continue
            items = json.loads(bf.read_text())
            recs = json.loads(vf.read_text())
            all_items += items
            calc_items = [it for it in items if it.get("isCalc") == "yes"]
            by_ref = {}
            for it in calc_items:
                ref = it.get("itemId") or str(it.get("questionNum"))
                by_ref[ref] = it
            rec_counts = Counter(str(r.get("itemId")) for r in recs)
            for ref in by_ref:
                if rec_counts.get(ref, 0) == 0:
                    problems.append(f"b{bn} {ref}: calc item has no verification record")
            for ref, cnt in rec_counts.items():
                if cnt > 1:
                    problems.append(f"b{bn} {ref}: itemId has {cnt} verification records, expected exactly one")
            for rec in recs:
                checked += 1
                ref = str(rec.get("itemId"))
                try:
                    exact = eval_expr(rec["expression"])
                    rounded = round_frac(exact, int(rec["decimalPlaces"]))
                    if Decimal(str(rec["expected"])) != rounded:
                        problems.append(f"b{bn} {ref}: expression gives {rounded}, record says {rec['expected']}")
                        continue
                except Exception as e:
                    problems.append(f"b{bn} {ref}: expression error: {e}")
                    continue
                it = by_ref.get(ref)
                if it is None:
                    problems.append(f"b{bn} {ref}: verify record has no matching calc item")
                    continue
                exp_str = str(rec["expected"])
                if c["variant"] == "treat":
                    if it.get("expression") != rec["expression"]:
                        problems.append(f"b{bn} {ref}: item expression != verify expression")
                    if str(it.get("expected")) != exp_str:
                        problems.append(f"b{bn} {ref}: item expected {it.get('expected')} != {exp_str}")
                    if it.get("decimalPlaces") != rec["decimalPlaces"] or it.get("unit") != rec["unit"]:
                        problems.append(f"b{bn} {ref}: item decimalPlaces/unit mismatch")
                    check_steps(it, rec, bn, ref, problems)
                elif c["variant"] == "net":
                    if it.get("calculationExpression") != rec["expression"]:
                        problems.append(f"b{bn} {ref}: item calculationExpression != verify expression")
                    if it.get("decimalPlaces") != rec["decimalPlaces"] or it.get("unit") != rec["unit"]:
                        problems.append(f"b{bn} {ref}: item decimalPlaces/unit mismatch")
                elif c["variant"] == "cand":
                    cc = it.get("calculationCheck") or {}
                    if cc.get("decimals") != rec["decimalPlaces"] or cc.get("unit") != rec["unit"]:
                        problems.append(f"b{bn} {ref}: calculationCheck decimals/unit mismatch")
                    elif abs(Decimal(str(cc.get("value"))) - (Decimal(exact.numerator) / Decimal(exact.denominator))) > Decimal("0.001"):
                        problems.append(f"b{bn} {ref}: calculationCheck value {cc.get('value')} disagrees with exact {float(exact):.6f}")
                check_correct_answer(it, rec, bn, ref, problems)
        entry = envelope(all_items)
        entry["checked"] = checked
        entry["problems"] = problems
        entry["checksPerformed"] = list(CHECKS_PERFORMED)
        updates[key] = entry
        total += checked; bad += len(problems)
        print(f"{key}: {checked} calc records checked, {len(problems)} problems")
        for p in problems:
            print("  FAIL", p)
    merge_report(updates)
    print(f"TOTAL: {total} calc records, {bad} problems")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
