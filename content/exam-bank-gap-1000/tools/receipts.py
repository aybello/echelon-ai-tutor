#!/usr/bin/env python3
"""Generate immutable per-bank review receipts for the gap-to-1000 package.

Each receipt binds: reviewer identity, UTC review date, source branch and
base commit, package SHA-256, per-batch file SHA-256, per-item payload
SHA-256 with canonical bank key, question number and itemId, the complete
structured results of every builder check (embedded verbatim from the
four report files in tools/), counts requested/generated/accepted/
withheld/rejected with reasons (from each bank's disposition.json,
written by the coordinator after verification; absent disposition = all
accepted), and a "bindings" block with the gap_config.json SHA-256, the
MANIFEST.json SHA-256 and the SHA-256 of each checker tool file plus
this file.

FAIL CLOSED, creation gate: this script refuses to run unless all four
report files (schema-validation-report.json, calc-verification-report.json,
dedup-report.json, quality-report.json) cover all banks in gap_config.json
with complete envelope fields and zero-error outcomes: schema errors
empty; calculation problems empty; dedup hard lists (exact,
expression_dups, option_collisions, cross_bank_exact) empty and every
dedup near flag dispositioned in the bank's disposition.json
nearDuplicatePairReview; quality hard flags zero. It also verifies
freshness at creation: each report entry's payloadDigest must equal the
package SHA-256 computed here for that bank, its configSha256 must equal
the current gap_config.json hash, and its checkerSha256 must equal the
current hash of the named tool file. Any mismatch aborts the run and no
receipts are written.

FAIL CLOSED, after creation: if any item payload changes after this
runs, its hash will not match the receipt and the package must not ship.
Verify with tools/verify_receipts.py. Re-run only after a fresh full
verification.

Usage: receipts.py <branch> <baseCommit>
Writes receipts/<courseKey>.receipt.json and receipts/INDEX.json.
"""
import hashlib, json, re, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "gap_config.json").read_text())
MANIFEST = json.loads((ROOT / "MANIFEST.json").read_text())
TOOLS = ROOT / "tools"
REVIEWER = "owner-authorized-ai-review"
MODEL = "Muse Wonder"
REPORT_FILES = {
    "schemaValidation": "schema-validation-report.json",
    "calculationVerification": "calc-verification-report.json",
    "dedup": "dedup-report.json",
    "quality": "quality-report.json",
}
CHECKER_FILES = ["validate_gap.py", "verify_calcs_gap.py", "dedup_gap.py",
                 "quality_checks.py", "receipts.py"]
DEDUP_HARD_KEYS = ("exact", "expression_dups", "option_collisions", "cross_bank_exact")
ITEM_ID_RE = re.compile(r"\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-\d+\b")

def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()

def sha_file(p):
    return sha_bytes(p.read_bytes())

def canon(it):
    return json.dumps(it, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def load_report(name):
    p = TOOLS / name
    if not p.exists():
        return None
    try:
        data = json.loads(p.read_text())
    except Exception:
        return None
    return data if isinstance(data, dict) else None

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

def entry_checker(entry):
    """Resolve a report entry's checker identity. Entries carry it at top
    level ("checker", "checkerSha256"); the dedup entry carries it inside
    its "config" block instead. Returns (name, sha256) with either part
    possibly None."""
    if isinstance(entry.get("checker"), str) and entry.get("checker"):
        return entry["checker"], entry.get("checkerSha256")
    cfgblk = entry.get("config")
    if isinstance(cfgblk, dict):
        return cfgblk.get("checker"), cfgblk.get("checkerSha256")
    return None, None

def near_dispositioned(near_entry, disp):
    """A dedup near flag is dispositioned when the bank's disposition.json
    nearDuplicatePairReview names the flagged pair. Near entries are
    either pair objects ({"a": itemId, "b": itemId, ...}) or strings
    whose leading reference and any second item reference must both be
    named by a review entry."""
    reviews = disp.get("nearDuplicatePairReview") or []
    texts = [r if isinstance(r, str) else json.dumps(r, sort_keys=True) for r in reviews]
    if not texts:
        return False
    if isinstance(near_entry, dict):
        refs = [near_entry.get("a"), near_entry.get("b")]
        pair = near_entry.get("pair")
        if isinstance(pair, (list, tuple)) and len(pair) == 2:
            refs = list(pair)
        refs = [r for r in refs if isinstance(r, str) and r]
        if not refs:
            return False
        return any(all(r in t for r in refs) for t in texts)
    s = str(near_entry)
    ref = s.split(":")[0].strip()
    others = [t for t in ITEM_ID_RE.findall(s) if t != ref]
    for t in texts:
        if ref in t and (not others or any(o in t for o in others) or s[:60] in t):
            return True
    return False

def main():
    if len(sys.argv) != 3:
        print("usage: receipts.py <branch> <baseCommit>")
        sys.exit(2)
    branch, base = sys.argv[1], sys.argv[2]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    config_hash = sha_file(ROOT / "gap_config.json")
    manifest_hash = sha_file(ROOT / "MANIFEST.json")
    checker_hashes = {name: sha_file(TOOLS / name) for name in CHECKER_FILES}
    reports = {kind: load_report(fname) for kind, fname in REPORT_FILES.items()}
    man = {b["courseKey"]: b for b in MANIFEST["banks"]}

    # First pass: compute per-bank package data and gate on the reports.
    failures = []
    bank_data = {}
    for key, c in CFG.items():
        d = ROOT / key
        addf = d / "additions.json"
        items = json.loads(addf.read_text()) if addf.exists() else []
        item_records = []
        for it in sorted(items, key=lambda x: x["questionNum"]):
            item_records.append({"bankKey": it.get("bankKey"), "questionNum": it.get("questionNum"),
                                 "itemId": it.get("itemId"), "payloadSha256": sha_bytes(canon(it))})
        pkg_hash = sha_bytes("".join(r["payloadSha256"] for r in item_records).encode())
        batch_hashes = {}
        for b in c["batches"]:
            bn = b["batch"]
            for suffix in (f"batch-{bn}.json", f"batch-{bn}.verify.json"):
                p = d / suffix
                if p.exists():
                    batch_hashes[suffix] = sha_file(p)
        disp = {}
        df = d / "disposition.json"
        if df.exists():
            disp = json.loads(df.read_text())
        bank_data[key] = {"items": items, "item_records": item_records, "pkg_hash": pkg_hash,
                          "batch_hashes": batch_hashes, "disp": disp, "addf": addf}
        for kind, fname in REPORT_FILES.items():
            rep = reports[kind]
            if rep is None:
                failures.append(f"{key}: report file tools/{fname} missing or unreadable")
                continue
            entry = rep.get(key)
            if not isinstance(entry, dict):
                failures.append(f"{key}: {fname} has no entry for this bank")
                continue
            checker_name, checker_sha = entry_checker(entry)
            missing_env = [field for field in ("configSha256", "payloadDigest")
                           if not (isinstance(entry.get(field), str) and entry[field])]
            if not (isinstance(checker_name, str) and checker_name):
                missing_env.append("checker")
            if not (isinstance(checker_sha, str) and checker_sha):
                missing_env.append("checkerSha256")
            for field in missing_env:
                failures.append(f"{key}: {fname} entry missing envelope field {field}")
            if missing_env:
                continue
            tool_path = TOOLS / checker_name
            if not tool_path.exists():
                failures.append(f"{key}: {fname} names unknown checker {checker_name!r}")
            elif checker_sha != sha_file(tool_path):
                failures.append(f"{key}: {fname} checkerSha256 does not match current {checker_name}")
            if entry["configSha256"] != config_hash:
                failures.append(f"{key}: {fname} configSha256 is stale (does not match current gap_config.json)")
            if entry["payloadDigest"] != pkg_hash:
                failures.append(f"{key}: {fname} payloadDigest does not match the current package payload hash (stale report)")
            if kind == "schemaValidation":
                if not isinstance(entry.get("errors"), list):
                    failures.append(f"{key}: schema report entry has no errors list")
                elif entry["errors"]:
                    failures.append(f"{key}: schema validation has {len(entry['errors'])} errors")
            elif kind == "calculationVerification":
                if not isinstance(entry.get("problems"), list):
                    failures.append(f"{key}: calc report entry has no problems list")
                elif entry["problems"]:
                    failures.append(f"{key}: calculation verification has {len(entry['problems'])} problems")
            elif kind == "dedup":
                corpus = entry.get("corpus")
                if not (isinstance(corpus, dict) and isinstance(corpus.get("corpusSha256"), str) and corpus["corpusSha256"]):
                    failures.append(f"{key}: dedup entry missing corpus.corpusSha256")
                if not isinstance(entry.get("config"), dict):
                    failures.append(f"{key}: dedup entry missing config block")
                for hk in DEDUP_HARD_KEYS:
                    if not isinstance(entry.get(hk), list):
                        failures.append(f"{key}: dedup entry has no {hk} list")
                    elif entry[hk]:
                        failures.append(f"{key}: dedup hard list {hk} has {len(entry[hk])} entries")
                near = entry.get("near")
                if not isinstance(near, list):
                    failures.append(f"{key}: dedup entry has no near list")
                else:
                    for n in near:
                        if not near_dispositioned(n, disp):
                            failures.append(f"{key}: dedup near flag not dispositioned in disposition.json nearDuplicatePairReview: {n}")
            elif kind == "quality":
                hc = quality_hard_count(entry)
                if hc is None:
                    failures.append(f"{key}: quality entry lacks the fields needed to count hard flags")
                elif hc != 0:
                    failures.append(f"{key}: quality hard flags = {hc}, expected 0")
    if failures:
        print("receipts.py: REFUSING to create receipts; report gate failed:")
        for f in failures:
            print("  FAIL", f)
        sys.exit(1)

    outdir = ROOT / "receipts"
    outdir.mkdir(exist_ok=True)
    index = {"build": "exam-bank-gap-1000", "reviewer": REVIEWER, "model": MODEL,
             "reviewDateUtc": now, "sourceBranch": branch, "baseCommit": base, "banks": {}}
    for key, c in CFG.items():
        data = bank_data[key]
        items = data["items"]
        disp = data["disp"]
        generated = sum(b["size"] for b in c["batches"])
        receipt = {
            "reviewer": REVIEWER, "model": MODEL, "reviewDateUtc": now,
            "sourceBranch": branch, "baseCommit": base,
            "courseKey": key, "canonicalBankKey": c["registryBankKey"], "itemBankKey": c["bankKey"],
            "packageSha256": data["pkg_hash"],
            "additionsFileSha256": sha_file(data["addf"]) if data["addf"].exists() else None,
            "batchFileSha256": data["batch_hashes"],
            "counts": {"requested": man[key]["requested"], "generated": generated,
                       "accepted": disp.get("accepted", len(items)),
                       "withheld": disp.get("withheld", []), "rejected": disp.get("rejected", [])},
            "checks": {
                "schemaValidation": reports["schemaValidation"][key],
                "calculationVerification": reports["calculationVerification"][key],
                "dedup": reports["dedup"][key],
                "quality": reports["quality"][key],
            },
            "bindings": {"gapConfigSha256": config_hash, "manifestSha256": manifest_hash,
                         "checkers": checker_hashes},
            "items": data["item_records"],
        }
        (outdir / f"{key}.receipt.json").write_text(json.dumps(receipt, indent=1))
        index["banks"][key] = {"packageSha256": data["pkg_hash"], "items": len(data["item_records"]),
                               "requested": man[key]["requested"]}
        print(f"{key}: receipt written, {len(data['item_records'])} items, package {data['pkg_hash'][:12]}")
    (outdir / "INDEX.json").write_text(json.dumps(index, indent=1))
    print("receipts index written")

if __name__ == "__main__":
    main()
