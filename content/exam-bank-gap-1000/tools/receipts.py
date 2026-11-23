#!/usr/bin/env python3
"""Generate immutable per-bank review receipts for the gap-to-1000 package.

Each receipt binds: reviewer identity, UTC review date, source branch and
base commit, package SHA-256, per-batch file SHA-256, per-item payload
SHA-256 with canonical bank key, question number and itemId, the results
of every builder check, and counts requested/generated/accepted/withheld/
rejected with reasons (from each bank's disposition.json, written by the
coordinator after verification; absent disposition = all accepted).

FAIL CLOSED: if any item payload changes after this runs, its hash will
not match the receipt and the package must not ship. Re-run only after a
fresh full verification.

Usage: receipts.py <branch> <baseCommit>
Writes receipts/<courseKey>.receipt.json and receipts/INDEX.json.
"""
import hashlib, json, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "gap_config.json").read_text())
MANIFEST = json.loads((ROOT / "MANIFEST.json").read_text())
TOOLS = ROOT / "tools"
REVIEWER = "owner-authorized-ai-review"
MODEL = "Muse Wonder"

def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()

def sha_file(p):
    return sha_bytes(p.read_bytes())

def canon(it):
    return json.dumps(it, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def load_report(name):
    p = TOOLS / name
    return json.loads(p.read_text()) if p.exists() else None

def main():
    branch, base = sys.argv[1], sys.argv[2]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    calc_rep = load_report("calc-verification-report.json")
    dedup_rep = load_report("dedup-report.json")
    quality_rep = load_report("quality-report.json")
    outdir = ROOT / "receipts"
    outdir.mkdir(exist_ok=True)
    index = {"build": "exam-bank-gap-1000", "reviewer": REVIEWER, "model": MODEL,
             "reviewDateUtc": now, "sourceBranch": branch, "baseCommit": base, "banks": {}}
    man = {b["courseKey"]: b for b in MANIFEST["banks"]}
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
        generated = sum(b["size"] for b in c["batches"])
        receipt = {
            "reviewer": REVIEWER, "model": MODEL, "reviewDateUtc": now,
            "sourceBranch": branch, "baseCommit": base,
            "courseKey": key, "canonicalBankKey": c["registryBankKey"], "itemBankKey": c["bankKey"],
            "packageSha256": pkg_hash, "additionsFileSha256": sha_file(addf) if addf.exists() else None,
            "batchFileSha256": batch_hashes,
            "counts": {"requested": man[key]["requested"], "generated": generated,
                       "accepted": disp.get("accepted", len(items)),
                       "withheld": disp.get("withheld", []), "rejected": disp.get("rejected", [])},
            "checks": {
                "schemaValidation": "see validate_gap.py run log in DUPLICATE-AND-SAFETY-REPORT.md",
                "calculationVerification": (calc_rep or {}).get(key),
                "dedup": ({k2: (len(v) if isinstance(v, list) else v) for k2, v in (dedup_rep or {}).get(key, {}).items()}),
                "quality": (quality_rep or {}).get(key),
            },
            "items": item_records,
        }
        (outdir / f"{key}.receipt.json").write_text(json.dumps(receipt, indent=1))
        index["banks"][key] = {"packageSha256": pkg_hash, "items": len(item_records),
                               "requested": man[key]["requested"]}
        print(f"{key}: receipt written, {len(item_records)} items, package {pkg_hash[:12]}")
    (outdir / "INDEX.json").write_text(json.dumps(index, indent=1))
    print("receipts index written")

if __name__ == "__main__":
    main()
