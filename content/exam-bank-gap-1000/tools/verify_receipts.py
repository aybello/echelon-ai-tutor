#!/usr/bin/env python3
"""Verify per-bank review receipts for the gap-to-1000 package.

Verification only: this script NEVER writes or overwrites receipts. It
loads every receipt and receipts/INDEX.json and checks, per bank:

1. Hashes recomputed from the current tree: per-item payload SHA-256,
   batch and verify file SHA-256, additions file SHA-256 and the package
   SHA-256 must equal the values recorded in the receipt.
2. Counts: requested (against MANIFEST.json), generated (batch sizes in
   gap_config.json) and accepted/withheld/rejected (against the bank's
   disposition.json) must equal the receipt's counts. INDEX.json must
   agree with each receipt on package hash and item count.
3. Embedded check evidence: the receipt's four embedded check results
   must be complete (structured objects, no null, empty or prose
   placeholders; schema errors empty; calculation problems empty; dedup
   hard lists empty; quality hard flags zero) and fresh: each entry's
   payloadDigest equals the current package hash, its configSha256
   equals the current gap_config.json hash, its checkerSha256 equals the
   current hash of the named tool file, and the dedup entry carries a
   corpus.corpusSha256. The receipt's bindings block must match the
   current gap_config.json hash, MANIFEST.json hash and checker hashes.
4. Fresh checker comparison: the four checkers are re-run as subprocesses
   (full runs; this rewrites the report JSONs in tools/, which are
   evidence inputs, never the receipts) and their complete fresh per-bank
   results must equal the receipt-embedded evidence, including all counts,
   corpus file hashes, configuration and checker bindings. Any failed
   checker subprocess fails verification even if an older report exists.

Any mismatch, missing, incomplete or stale evidence prints the specific
failure and the script exits 1. Otherwise it prints a PASS line per bank
and a final verdict and exits 0.

Usage: verify_receipts.py
"""
import hashlib, json, subprocess, sys
from pathlib import Path
from receipts import near_dispositioned

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
CFG = json.loads((ROOT / "gap_config.json").read_text())
MANIFEST = json.loads((ROOT / "MANIFEST.json").read_text())
CHECKER_FILES = ["validate_gap.py", "verify_calcs_gap.py", "dedup_gap.py",
                 "quality_checks.py", "receipts.py", "verify_receipts.py"]
REPORT_FILES = {
    "schemaValidation": "schema-validation-report.json",
    "calculationVerification": "calc-verification-report.json",
    "dedup": "dedup-report.json",
    "quality": "quality-report.json",
}
CHECKER_SCRIPTS = ["validate_gap.py", "verify_calcs_gap.py", "dedup_gap.py", "quality_checks.py"]
DEDUP_HARD_KEYS = ("exact", "expression_dups", "option_collisions", "cross_bank_exact")

def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()

def sha_file(p):
    return sha_bytes(p.read_bytes())

def canon(it):
    return json.dumps(it, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def entry_checker(entry):
    """Resolve a check entry's checker identity. Entries carry it at top
    level ("checker", "checkerSha256"); the dedup entry carries it inside
    its "config" block instead. Returns (name, sha256) with either part
    possibly None."""
    if isinstance(entry.get("checker"), str) and entry.get("checker"):
        return entry["checker"], entry.get("checkerSha256")
    cfgblk = entry.get("config")
    if isinstance(cfgblk, dict):
        return cfgblk.get("checker"), cfgblk.get("checkerSha256")
    return None, None

def quality_hard_count(entry):
    if not isinstance(entry, dict):
        return None
    if "hard_flags" in entry and isinstance(entry["hard_flags"], list):
        return len(entry["hard_flags"])
    if "hardFlags" in entry and isinstance(entry["hardFlags"], (int, float)):
        return int(entry["hardFlags"])
    if not all(k in entry for k in ("length_hard", "position_flags", "true_false_share")):
        return None
    return (len(entry["length_hard"]) + len(entry["position_flags"])
            + (1 if entry["true_false_share"] > 0.05 else 0))

def dedup_hard_count(entry):
    if not isinstance(entry, dict):
        return None
    total = 0
    for hk in DEDUP_HARD_KEYS:
        if not isinstance(entry.get(hk), list):
            return None
        total += len(entry[hk])
    return total

def outcome_summary(kind, entry):
    """Comparable outcome summary for one bank's check entry, or None if
    the entry is too incomplete to summarize."""
    if not isinstance(entry, dict):
        return None
    digest = entry.get("payloadDigest")
    if kind == "schemaValidation":
        if not isinstance(entry.get("errors"), list):
            return None
        return {"errors": len(entry["errors"]), "payloadDigest": digest}
    if kind == "calculationVerification":
        if not isinstance(entry.get("problems"), list):
            return None
        return {"problems": len(entry["problems"]), "payloadDigest": digest}
    if kind == "dedup":
        hard = dedup_hard_count(entry)
        if hard is None or not isinstance(entry.get("near"), list):
            return None
        return {"hard": hard, "near": len(entry["near"]), "payloadDigest": digest}
    if kind == "quality":
        hard = quality_hard_count(entry)
        if hard is None:
            return None
        return {"hard": hard, "payloadDigest": digest}
    return None

def main():
    failures = []
    config_hash = sha_file(ROOT / "gap_config.json")
    manifest_hash = sha_file(ROOT / "MANIFEST.json")
    checker_hashes = {name: sha_file(TOOLS / name) for name in CHECKER_FILES}
    man = {b["courseKey"]: b for b in MANIFEST["banks"]}
    receipts_dir = ROOT / "receipts"
    index = None
    index_path = receipts_dir / "INDEX.json"
    if not index_path.exists():
        failures.append("receipts/INDEX.json is missing")
    else:
        try:
            index = json.loads(index_path.read_text())
        except Exception as e:
            failures.append(f"receipts/INDEX.json is unreadable: {e}")
    bank_ok = {key: True for key in CFG}

    def fail(key, msg):
        failures.append(msg)
        if key in bank_ok:
            bank_ok[key] = False

    receipts = {}
    for key, c in CFG.items():
        rp = receipts_dir / f"{key}.receipt.json"
        if not rp.exists():
            fail(key, f"{key}: receipt file missing: receipts/{key}.receipt.json")
            continue
        try:
            receipts[key] = json.loads(rp.read_text())
        except Exception as e:
            fail(key, f"{key}: receipt unreadable: {e}")

    for key, c in CFG.items():
        receipt = receipts.get(key)
        if receipt is None:
            continue
        d = ROOT / key
        addf = d / "additions.json"
        items = json.loads(addf.read_text()) if addf.exists() else []
        item_records = []
        for it in sorted(items, key=lambda x: x["questionNum"]):
            item_records.append({"bankKey": it.get("bankKey"), "questionNum": it.get("questionNum"),
                                 "itemId": it.get("itemId"), "payloadSha256": sha_bytes(canon(it))})
        pkg_hash = sha_bytes("".join(r["payloadSha256"] for r in item_records).encode())
        if receipt.get("items") != item_records:
            fail(key, f"{key}: receipt item payload hashes do not match the current tree")
        if receipt.get("packageSha256") != pkg_hash:
            fail(key, f"{key}: receipt packageSha256 {str(receipt.get('packageSha256'))[:12]} != recomputed {pkg_hash[:12]}")
        add_hash = sha_file(addf) if addf.exists() else None
        if receipt.get("additionsFileSha256") != add_hash:
            fail(key, f"{key}: receipt additionsFileSha256 does not match the current additions.json")
        batch_hashes = {}
        for b in c["batches"]:
            bn = b["batch"]
            for suffix in (f"batch-{bn}.json", f"batch-{bn}.verify.json"):
                p = d / suffix
                if p.exists():
                    batch_hashes[suffix] = sha_file(p)
        if receipt.get("batchFileSha256") != batch_hashes:
            fail(key, f"{key}: receipt batchFileSha256 does not match the current batch files")
        disp = {}
        df = d / "disposition.json"
        if df.exists():
            disp = json.loads(df.read_text())
        want_counts = {"requested": man[key]["requested"],
                       "generated": sum(b["size"] for b in c["batches"]),
                       "accepted": disp.get("accepted", len(items)),
                       "withheld": disp.get("withheld", []), "rejected": disp.get("rejected", [])}
        if receipt.get("counts") != want_counts:
            fail(key, f"{key}: receipt counts {receipt.get('counts')} != expected {want_counts}")
        if index is not None:
            ientry = (index.get("banks") or {}).get(key)
            if not isinstance(ientry, dict):
                fail(key, f"{key}: INDEX.json has no entry for this bank")
            else:
                if ientry.get("packageSha256") != receipt.get("packageSha256"):
                    fail(key, f"{key}: INDEX.json packageSha256 disagrees with the receipt")
                if ientry.get("items") != len(item_records):
                    fail(key, f"{key}: INDEX.json item count disagrees with the receipt")
        bindings = receipt.get("bindings")
        if not isinstance(bindings, dict):
            fail(key, f"{key}: receipt has no bindings block")
        else:
            if bindings.get("gapConfigSha256") != config_hash:
                fail(key, f"{key}: bindings.gapConfigSha256 is stale")
            if bindings.get("manifestSha256") != manifest_hash:
                fail(key, f"{key}: bindings.manifestSha256 is stale")
            if bindings.get("checkers") != checker_hashes:
                fail(key, f"{key}: bindings.checkers do not match the current tool file hashes")
        checks = receipt.get("checks")
        if not isinstance(checks, dict):
            fail(key, f"{key}: receipt has no checks block")
            continue
        for kind in REPORT_FILES:
            entry = checks.get(kind)
            if not isinstance(entry, dict) or not entry:
                fail(key, f"{key}: embedded check {kind} is missing, null, empty or prose")
                continue
            checker_name, checker_sha = entry_checker(entry)
            expected_checker = CHECKER_SCRIPTS[list(REPORT_FILES).index(kind)]
            if checker_name != expected_checker:
                fail(key, f"{key}: embedded check {kind} must name {expected_checker}")
            for field in ("configSha256", "payloadDigest"):
                if not (isinstance(entry.get(field), str) and entry[field]):
                    fail(key, f"{key}: embedded check {kind} missing envelope field {field}")
            if not (isinstance(checker_name, str) and checker_name):
                fail(key, f"{key}: embedded check {kind} missing envelope field checker")
            if not (isinstance(checker_sha, str) and checker_sha):
                fail(key, f"{key}: embedded check {kind} missing envelope field checkerSha256")
            if entry.get("payloadDigest") != pkg_hash:
                fail(key, f"{key}: embedded check {kind} payloadDigest is stale (does not equal the current package hash)")
            if entry.get("configSha256") != config_hash:
                fail(key, f"{key}: embedded check {kind} configSha256 is stale")
            tool_path = TOOLS / str(checker_name)
            if not tool_path.exists() or checker_sha != sha_file(tool_path):
                fail(key, f"{key}: embedded check {kind} checkerSha256 does not match the current tool file")
            summary = outcome_summary(kind, entry)
            if summary is None:
                fail(key, f"{key}: embedded check {kind} is incomplete (no countable outcome fields)")
            elif kind == "schemaValidation" and summary["errors"] != 0:
                fail(key, f"{key}: embedded schema check records {summary['errors']} errors")
            elif kind == "calculationVerification" and summary["problems"] != 0:
                fail(key, f"{key}: embedded calc check records {summary['problems']} problems")
            elif kind == "quality" and summary["hard"] != 0:
                fail(key, f"{key}: embedded quality check records {summary['hard']} hard flags")
            elif kind == "dedup":
                if summary["hard"] != 0:
                    fail(key, f"{key}: embedded dedup check records {summary['hard']} hard duplicates")
                corpus = entry.get("corpus")
                if not (isinstance(corpus, dict) and isinstance(corpus.get("corpusSha256"), str) and corpus["corpusSha256"]):
                    fail(key, f"{key}: embedded dedup check missing corpus.corpusSha256")
                for flag in entry.get("near", []):
                    if not near_dispositioned(flag, disp):
                        fail(key, f"{key}: embedded dedup near flag has no disposition: {flag}")

    # Fresh checker comparison: re-run the four checkers (full runs).
    for script in CHECKER_SCRIPTS:
        proc = subprocess.run([sys.executable, "-B", str(TOOLS / script)],
                              capture_output=True, text=True, cwd=str(ROOT))
        if proc.returncode != 0:
            failures.append(f"checker {script} failed on re-run (exit {proc.returncode}): {(proc.stdout + proc.stderr).strip()[-600:]}")
    fresh_reports = {}
    for kind, fname in REPORT_FILES.items():
        p = TOOLS / fname
        try:
            fresh_reports[kind] = json.loads(p.read_text())
        except Exception:
            fresh_reports[kind] = None
            failures.append(f"fresh report tools/{fname} missing or unreadable after checker re-run")
    for key in CFG:
        receipt = receipts.get(key)
        if receipt is None or not isinstance(receipt.get("checks"), dict):
            continue
        for kind in REPORT_FILES:
            fresh = (fresh_reports.get(kind) or {}).get(key)
            embedded = receipt["checks"].get(kind)
            fs = outcome_summary(kind, fresh)
            if fs is None:
                fail(key, f"{key}: fresh {kind} outcome for this bank is missing or incomplete after re-run")
            elif fresh != embedded:
                fail(key, f"{key}: fresh {kind} evidence differs from receipt-embedded evidence (including counts, corpus and checker bindings)")

    for key in CFG:
        if bank_ok[key]:
            print(f"{key}: PASS")
    for f in failures:
        print("FAIL", f)
    if failures:
        print(f"VERDICT: FAIL ({len(failures)} failures)")
        sys.exit(1)
    print(f"VERDICT: PASS (all {len(CFG)} bank receipts verified)")
    sys.exit(0)

if __name__ == "__main__":
    main()
