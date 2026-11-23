#!/usr/bin/env python3
"""Negative tests for the gap-to-1000 checking and receipt tooling.

Works on fresh copies of the package tree under /tmp (copied from the
tree this script lives in; the original tree is never modified). Each
case tampers with its own sub-copy and proves the tamper is rejected:

1. Wrong numeric answer: one verify record's "expected" is changed to a
   wrong value; verify_calcs_gap.py must exit nonzero.
2. Duplicate verification reference: one record in a batch verify file
   is duplicated; verify_calcs_gap.py must exit nonzero.
3. Missing calculation record: one record is deleted from a batch
   verify file; verify_calcs_gap.py must exit nonzero.
4. Stale receipt: receipts are created in the sub-copy (all four
   checkers run fully first, then receipts.py), then one item's question
   text is changed in a batch file and additions.json is rebuilt with
   assemble_gap.py; verify_receipts.py must exit nonzero.

Cases 1 to 3 use the small class2-ww bank (6 items, 1 calculation item)
to stay fast. Case 4 needs receipts for all banks, so it runs the full
pipeline in its sub-copy.

Prints PASS or FAIL per case (PASS means the tamper was correctly
rejected). Exits 0 only if all four cases are rejected as required; a
setup failure in any case is a FAIL for that case, with the reason
printed.
"""
import json, shutil, subprocess, sys
from decimal import Decimal
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent
WORK = Path("/tmp/gap1000-negative-tests")
PY = sys.executable
SMALL_BANK = "class2-ww"

def run(args, cwd):
    return subprocess.run([PY] + [str(a) for a in args],
                          capture_output=True, text=True, cwd=str(cwd))

def fresh_copy(name):
    dst = WORK / name
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(SRC, dst, ignore=shutil.ignore_patterns("__pycache__"))
    return dst

def tail(text, n=12):
    lines = [ln for ln in text.strip().splitlines() if ln.strip()]
    return "\n".join(lines[-n:])

def case1():
    tree = fresh_copy("case1-wrong-answer")
    vf = tree / SMALL_BANK / "batch-1.verify.json"
    recs = json.loads(vf.read_text())
    recs[0]["expected"] = str(Decimal(str(recs[0]["expected"])) + Decimal("7"))
    vf.write_text(json.dumps(recs, indent=1))
    proc = run([tree / "tools" / "verify_calcs_gap.py", SMALL_BANK], tree)
    return proc.returncode != 0, proc

def case2():
    tree = fresh_copy("case2-duplicate-record")
    vf = tree / SMALL_BANK / "batch-1.verify.json"
    recs = json.loads(vf.read_text())
    recs.append(dict(recs[0]))
    vf.write_text(json.dumps(recs, indent=1))
    proc = run([tree / "tools" / "verify_calcs_gap.py", SMALL_BANK], tree)
    return proc.returncode != 0, proc

def case3():
    tree = fresh_copy("case3-missing-record")
    vf = tree / SMALL_BANK / "batch-1.verify.json"
    recs = json.loads(vf.read_text())
    del recs[0]
    vf.write_text(json.dumps(recs, indent=1))
    proc = run([tree / "tools" / "verify_calcs_gap.py", SMALL_BANK], tree)
    return proc.returncode != 0, proc

def case4():
    tree = fresh_copy("case4-stale-receipt")
    for script in ("validate_gap.py", "verify_calcs_gap.py", "dedup_gap.py", "quality_checks.py"):
        proc = run([tree / "tools" / script], tree)
        if proc.returncode not in (0, 1):
            return False, f"setup: {script} crashed (exit {proc.returncode}): {tail(proc.stderr)}"
    proc = run([tree / "tools" / "receipts.py", "negative-test-branch", "negative-test-commit"], tree)
    if proc.returncode != 0:
        return False, "setup: receipts.py refused to create receipts in the untampered sub-copy:\n" + tail(proc.stdout + "\n" + proc.stderr)
    bf = tree / SMALL_BANK / "batch-1.json"
    items = json.loads(bf.read_text())
    items[0]["question"] = items[0]["question"] + " Tampered after receipt creation."
    bf.write_text(json.dumps(items, indent=1, ensure_ascii=False))
    proc = run([tree / "tools" / "assemble_gap.py", SMALL_BANK], tree)
    if proc.returncode != 0:
        return False, "setup: assemble_gap.py failed after tamper:\n" + tail(proc.stdout + "\n" + proc.stderr)
    proc = run([tree / "tools" / "verify_receipts.py"], tree)
    return proc.returncode != 0, proc

def main():
    if WORK.exists():
        shutil.rmtree(WORK)
    WORK.mkdir(parents=True)
    cases = [
        ("case1 wrong numeric answer rejected by verify_calcs_gap.py", case1),
        ("case2 duplicate verification record rejected by verify_calcs_gap.py", case2),
        ("case3 missing calculation record rejected by verify_calcs_gap.py", case3),
        ("case4 stale receipt rejected by verify_receipts.py", case4),
    ]
    all_ok = True
    for label, fn in cases:
        try:
            ok, detail = fn()
        except Exception as e:
            ok, detail = False, f"exception: {e}"
        print(f"{'PASS' if ok else 'FAIL'} {label}")
        if not ok:
            all_ok = False
            text = detail if isinstance(detail, str) else tail(detail.stdout + "\n" + detail.stderr)
            if text:
                print("  detail:", text)
    print("ALL CASES REJECTED" if all_ok else "SOME CASES NOT REJECTED")
    sys.exit(0 if all_ok else 1)

if __name__ == "__main__":
    main()
