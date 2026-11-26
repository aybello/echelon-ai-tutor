#!/usr/bin/env python3
"""Schema and consistency validation for the gap-to-1000 build.

Driven by ../gap_config.json and each bank's assignments. Checks: exact
field sets per schema variant, bankKey, questionNum/itemId sequence against
the assignment, composition (conceptual first, calc last, counts),
difficulty/cognitiveLevel against the assignment, options integrity,
correctAnswer consistency, module membership, em dash ban, verify-file
record count.

Usage: validate_gap.py [courseKey ...]  (default: all banks in config)
Exit 1 if any errors.

Also writes tools/schema-validation-report.json: per bank an object with
"errors", "warnings" and the shared report envelope ("checker",
"checkerSha256", "configSha256", "payloadDigest"). A run with explicit
bank arguments merges: it updates only those banks in the existing report
file. A run with no arguments recomputes every bank.
"""
import hashlib, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "gap_config.json").read_text())
REPORT = Path(__file__).resolve().parent / "schema-validation-report.json"
CHECKER = Path(__file__).name

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

BASE = {
    "oit": {"questionNum", "bankKey", "stream", "module", "topic", "difficulty", "cognitiveLevel",
            "question", "optionA", "optionB", "optionC", "optionD", "options", "correctIndex",
            "correctAnswer", "explanation", "isCalc", "formula", "sourceTitle", "sourceReference",
            "sourceUrl", "blueprintObjective", "reviewStatus", "itemId"},
    "treat": {"topic", "question", "correctAnswer", "explanation", "isCalc", "bankKey", "questionNum",
              "itemId", "module", "options", "correctIndex", "reviewStatus", "difficulty",
              "cognitiveLevel", "sourceTitle", "sourceUrl", "sourceReference", "blueprintObjective",
              "evidenceStatus", "optionA", "optionB", "optionC", "optionD"},
    "net": {"questionNum", "bankKey", "itemId", "module", "topic", "question", "correctAnswer",
            "explanation", "isCalc", "formula", "options", "optionA", "optionB", "optionC", "optionD",
            "correctIndex", "difficulty", "cognitiveLevel", "sourceTitle", "sourceUrl",
            "sourceReference", "blueprintObjective", "reviewStatus", "evidenceStatus"},
    "cand": {"bankKey", "questionNum", "module", "difficulty", "question", "options", "correctIndex",
             "explanation", "steps", "tip", "isCalc", "topic", "cognitiveLevel", "sourceTitle",
             "sourceReference", "sourceUrl", "blueprintObjective", "reviewStatus", "reviewedBy", "reviewedAt"},
}
CALC_ADD = {
    "oit": set(),
    "treat": {"formula", "expression", "expected", "decimalPlaces", "unit", "steps", "tip"},
    "net": {"calculationExpression", "decimalPlaces", "unit", "steps"},
    "cand": {"calculationCheck"},
}

def check_bank(key):
    c = CFG[key]
    errs, warns = [], []
    all_items = []
    d = ROOT / key
    variant = c["variant"]
    for b in c["batches"]:
        bn = b["batch"]
        f = d / f"batch-{bn}.json"
        asg = json.loads((d / "assignments" / f"batch-{bn}.json").read_text())
        plan = asg["items"]
        if not f.exists():
            errs.append(f"{key} batch {bn}: file missing")
            continue
        try:
            items = json.loads(f.read_text())
        except Exception as e:
            errs.append(f"{key} batch {bn}: JSON parse error: {e}")
            continue
        if not isinstance(items, list) or len(items) != b["size"]:
            errs.append(f"{key} batch {bn}: expected {b['size']} items, got {len(items) if isinstance(items, list) else type(items)}")
            continue
        all_items += [it for it in items if isinstance(it, dict) and "questionNum" in it]
        base = BASE[variant]
        for i, it in enumerate(items):
            tag = f"{key} b{bn} item {i + 1}"
            p = plan[i]
            if not isinstance(it, dict):
                errs.append(f"{tag}: not an object"); continue
            want = set(base) | (CALC_ADD[variant] if it.get("isCalc") == "yes" else set())
            got = set(it.keys())
            if got != want:
                errs.append(f"{tag}: field set mismatch; missing={sorted(want - got)} extra={sorted(got - want)}")
            if it.get("bankKey") != c["bankKey"]:
                errs.append(f"{tag}: bankKey {it.get('bankKey')!r} != {c['bankKey']!r}")
            if it.get("questionNum") != p["questionNum"]:
                errs.append(f"{tag}: questionNum {it.get('questionNum')!r} != {p['questionNum']}")
            if variant != "cand" and it.get("itemId") != p["itemId"]:
                errs.append(f"{tag}: itemId {it.get('itemId')!r} != {p['itemId']}")
            want_calc = "yes" if p["kind"] == "calc" else "no"
            if it.get("isCalc") != want_calc:
                errs.append(f"{tag}: isCalc {it.get('isCalc')!r} != {want_calc!r}")
            if it.get("difficulty") != p["difficulty"]:
                errs.append(f"{tag}: difficulty {it.get('difficulty')!r} != {p['difficulty']!r}")
            if it.get("cognitiveLevel") != p["cognitiveLevel"]:
                errs.append(f"{tag}: cognitiveLevel {it.get('cognitiveLevel')!r} != {p['cognitiveLevel']!r}")
            # topic: assignment topic may carry a [Module] prefix; item topic strips it
            atopic = p["topic"]
            if atopic.startswith("["):
                mod, _, rest = atopic[1:].partition("] ")
                if it.get("module") != mod:
                    errs.append(f"{tag}: module {it.get('module')!r} != bracket module {mod!r}")
                if it.get("topic") != rest and str(it.get("topic", "")).lower() != rest.lower():
                    warns.append(f"{tag}: topic {it.get('topic')!r} != assignment topic {rest!r}")
            opts = it.get("options")
            if not (isinstance(opts, list) and len(opts) == 4 and all(isinstance(o, str) and o.strip() for o in opts)):
                errs.append(f"{tag}: options must be 4 non-empty strings")
            elif len({o.strip().lower() for o in opts}) != 4:
                errs.append(f"{tag}: options not distinct")
            else:
                ci = it.get("correctIndex")
                if ci not in (0, 1, 2, 3):
                    errs.append(f"{tag}: correctIndex {ci!r} out of range")
                else:
                    if "correctAnswer" in it and it.get("correctAnswer") != opts[ci]:
                        errs.append(f"{tag}: correctAnswer != options[correctIndex]")
                    if "optionA" in it:
                        for j, k in enumerate(("optionA", "optionB", "optionC", "optionD")):
                            if it.get(k) != opts[j]:
                                errs.append(f"{tag}: {k} != options[{j}]")
            if it.get("module") not in c["modules"]:
                errs.append(f"{tag}: module {it.get('module')!r} not in course module list")
            if not (isinstance(it.get("question"), str) and it["question"].strip()):
                errs.append(f"{tag}: blank question")
            if not (isinstance(it.get("explanation"), str) and it["explanation"].strip()):
                errs.append(f"{tag}: blank explanation")
            for k2, v in it.items():
                if isinstance(v, str) and "—" in v and k2 not in ("sourceTitle", "sourceReference"):
                    errs.append(f"{tag}: em dash in field {k2}")
                if isinstance(v, str) and "–" in v and k2 in ("question", "explanation", "correctAnswer"):
                    warns.append(f"{tag}: en dash in field {k2}")
            if it.get("isCalc") == "yes":
                if variant == "oit" and not str(it.get("formula", "")).strip():
                    errs.append(f"{tag}: calc item with empty formula")
                if variant in ("treat", "net", "cand") and it.get("steps"):
                    try:
                        st = json.loads(it["steps"])
                        assert isinstance(st, list) and all(set(x) == {"l", "c"} for x in st)
                    except Exception:
                        errs.append(f"{tag}: steps is not a JSON list of {{l, c}} entries")
                if variant == "cand":
                    cc = it.get("calculationCheck")
                    if not (isinstance(cc, dict) and set(cc) == {"value", "decimals", "unit"}):
                        errs.append(f"{tag}: calculationCheck malformed")
        vf = d / f"batch-{bn}.verify.json"
        if not vf.exists():
            errs.append(f"{key} batch {bn}: verify file missing")
        else:
            try:
                recs = json.loads(vf.read_text())
                if len(recs) != b["calc"]:
                    errs.append(f"{key} batch {bn}: verify file has {len(recs)} records, expected {b['calc']}")
            except Exception as e:
                errs.append(f"{key} batch {bn}: verify JSON parse error: {e}")
    return errs, warns, all_items

def main():
    keys = sys.argv[1:] or list(CFG)
    te = tw = 0
    updates = {}
    for key in keys:
        errs, warns, all_items = check_bank(key)
        te += len(errs); tw += len(warns)
        for e in errs: print("ERROR", e)
        for w in warns: print("warn ", w)
        print(f"{key}: {len(errs)} errors, {len(warns)} warnings")
        entry = envelope(all_items)
        entry["errors"] = errs
        entry["warnings"] = warns
        updates[key] = entry
    merge_report(updates)
    print("TOTAL:", te, "errors,", tw, "warnings")
    sys.exit(1 if te else 0)

if __name__ == "__main__":
    main()
