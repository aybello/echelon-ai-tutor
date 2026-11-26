#!/usr/bin/env python3
"""Portable, isolated regression checks for gap content/evidence tooling.

Copies only required corpus files and the package to a unique temporary tree.
No source-tree writes, author-workspace dependencies, or review regeneration.
A baseline must pass before any negative result can count as a rejection.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent
SMALL_BANK = "class2-ww"


def main():
    cfg = json.loads((SRC / "gap_config.json").read_text())
    keys = sorted(set(cfg) | {
        "oit", "oit-ww", "class1-water", "class1-ww", "class1-water-dist",
        "class1-wastewater-coll", "class2-wastewater-coll", "class3-water-dist",
        "wpi-class4-wastewater",
    })
    with tempfile.TemporaryDirectory(prefix="gap1000-negative-") as tmp:
        content = Path(tmp) / "content"
        tree = content / "exam-bank-gap-1000"
        shutil.copytree(SRC, tree, ignore=shutil.ignore_patterns("__pycache__", "*-report.json"))
        banks = Path(os.environ.get("GAP_DEDUP_BANKS_DIR", SRC.parent))
        nov22 = Path(os.environ.get("GAP_DEDUP_NOV22_DIR", SRC.parent / "exam-bank-expansion"))
        for c in cfg.values():
            for rel in c["dedupSeedFiles"]:
                dst = content / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(banks / rel, dst)
        for key in keys:
            names = ("additions-water.json", "additions-wastewater.json") if key == "oit" else (
                ("additions-wastewater.json",) if key == "oit-ww" else ("additions.json",))
            for name in names:
                dst = content / "exam-bank-expansion" / key / name
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(nov22 / key / name, dst)
        env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
        env.pop("GAP_DEDUP_BANKS_DIR", None)
        env.pop("GAP_DEDUP_NOV22_DIR", None)

        def run(script, *args):
            return subprocess.run([sys.executable, "-B", str(tree / "tools" / script), *args],
                                  capture_output=True, text=True, cwd=tree, env=env)

        @contextmanager
        def changed(path, mutate):
            old = path.read_bytes()
            try:
                value = json.loads(old)
                mutate(value)
                path.write_text(json.dumps(value, ensure_ascii=False))
                yield
            finally:
                path.write_bytes(old)

        @contextmanager
        def missing(path):
            old = path.read_bytes()
            path.unlink()
            try:
                yield
            finally:
                path.write_bytes(old)

        passed = 0
        failed = 0

        def expect(label, proc, rejected=False, diagnostic=None):
            nonlocal passed, failed
            output = proc.stdout + proc.stderr
            ok = (proc.returncode != 0 if rejected else proc.returncode == 0)
            if diagnostic:
                ok = ok and diagnostic in output
            print(f"{'PASS' if ok else 'FAIL'} {label}", flush=True)
            if ok:
                passed += 1
            else:
                failed += 1
                print(output[-1800:])
            return ok

        for script in ("validate_gap.py", "verify_calcs_gap.py", "dedup_gap.py", "quality_checks.py"):
            if not expect(f"baseline {script}", run(script)):
                return 1
        if not expect("evidence-only refresh", run("receipts.py", "--refresh-evidence")):
            return 1
        if not expect("baseline all 26 receipts", run("verify_receipts.py")):
            return 1

        batch = tree / SMALL_BANK / "batch-1.json"
        verify = tree / SMALL_BANK / "batch-1.verify.json"
        items = json.loads(batch.read_text())
        calc_index = next(i for i, it in enumerate(items) if it["isCalc"] == "yes")
        rec = json.loads(verify.read_text())[0]

        def answer_mutator(answer):
            def mutate(value):
                item = value[calc_index]
                item["correctAnswer"] = answer
                item["options"][item["correctIndex"]] = answer
                item["option" + "ABCD"[item["correctIndex"]]] = answer
            return mutate

        for label, answer in (
            ("wrong numeric substring answer", f"9{rec['expected']} {rec['unit']}"),
            ("wrong answer unit", f"{rec['expected']} incorrect-unit"),
            ("extraneous currency prefix", f"${rec['expected']} {rec['unit']}"),
            ("malformed comma number", "3,0 " + rec["unit"]),
        ):
            with changed(batch, answer_mutator(answer)):
                expect(label, run("verify_calcs_gap.py", SMALL_BANK), True, "correctAnswer")

        with changed(verify, lambda v: v.append(dict(v[0]))):
            expect("duplicate verification record", run("verify_calcs_gap.py", SMALL_BANK), True, "expected exactly one")
        with changed(verify, lambda v: v.clear()):
            expect("missing verification record", run("verify_calcs_gap.py", SMALL_BANK), True, "no verification record")
        with changed(verify, lambda v: v[0].update(itemId="ORPHAN-999")):
            expect("orphan verification record", run("verify_calcs_gap.py", SMALL_BANK), True, "no matching calc item")
        with changed(batch, lambda v: v[0].update(question=v[0]["question"] + " Stale receipt.")):
            expect("stale payload receipt", run("verify_receipts.py"), True, "batchFileSha256")

        corpus = content / "exam-bank-expansion" / SMALL_BANK / "additions.json"
        with changed(corpus, lambda v: v[0].update(explanation=v[0]["explanation"] + " Corpus provenance tamper.")):
            expect("receipt creation refuses stale corpus", run("receipts.py", "--refresh-evidence"), True, "corpus evidence missing or stale")
            expect("stale same-bank corpus", run("verify_receipts.py"), True, "fresh dedup evidence differs")
        global_file = content / "exam-bank-expansion/class1-water/additions.json"
        with changed(global_file, lambda v: v[0].update(explanation=v[0]["explanation"] + " Global corpus tamper.")):
            expect("stale cross-bank global corpus", run("verify_receipts.py"), True, "fresh dedup evidence differs")
        with missing(global_file):
            expect("missing global required corpus", run("dedup_gap.py", SMALL_BANK), True, "required corpus file missing")
        seed = content / cfg[SMALL_BANK]["dedupSeedFiles"][0]
        with missing(seed):
            expect("missing seed corpus", run("dedup_gap.py", SMALL_BANK), True, "required corpus file missing")
        with changed(global_file, lambda v: v.pop()):
            expect("truncated required corpus", run("dedup_gap.py", SMALL_BANK), True, "expected 200 items")

        receipt = tree / "receipts" / f"{SMALL_BANK}.receipt.json"
        with changed(receipt, lambda v: v["checks"]["calculationVerification"].update(checked=0)):
            expect("incomplete embedded calculation evidence", run("verify_receipts.py"), True, "fresh calculationVerification evidence differs")
        with changed(receipt, lambda v: v["checks"].update(dedup=None)):
            expect("missing embedded check evidence", run("verify_receipts.py"), True, "missing, null, empty or prose")
        with changed(receipt, lambda v: v["checks"]["quality"].update(length_hard=["tampered hard failure"])):
            expect("embedded quality hard failure", run("verify_receipts.py"), True, "embedded quality check records")
        # Fresh generation after all mutations is required; verification never repairs receipts.
        expect("final restored baseline", run("verify_receipts.py"))
        print(f"RESULT: {passed} passed, {failed} failed", flush=True)
        return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
