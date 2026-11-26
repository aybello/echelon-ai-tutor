#!/usr/bin/env python3
"""Schema and consistency validation for exam-bank expansion batches.

Usage: validate.py <courseKey> [batch ...]   (default: all batches present)
Prints one line per problem and a summary. Exit 1 if any errors.
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from courses_data import COURSES

# Resolve from the checked-in package so validation works from any clone.
ROOT = Path(__file__).resolve().parents[1]
CFG = {c["key"]: c for c in COURSES}

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

def expected_numbers(course, batch):
    seg = next(s for s in course["segments"] if batch in s["batches"])
    off = (batch - seg["batches"][0]) * 50
    qns = [seg["qnBase"] + off + i for i in range(50)]
    ids = [course["itemFmt"] % (course["itemStart"] + (batch - 1) * 50 + i) for i in range(50)]
    return qns, ids

def check_course(key, batches):
    c = CFG[key]
    errs, warns = [], []
    d = ROOT / key
    for b in batches:
        f = d / f"batch-{b}.json"
        if not f.exists():
            errs.append(f"{key} batch {b}: file missing")
            continue
        try:
            items = json.loads(f.read_text())
        except Exception as e:
            errs.append(f"{key} batch {b}: JSON parse error: {e}")
            continue
        if not isinstance(items, list) or len(items) != 50:
            errs.append(f"{key} batch {b}: expected a list of 50 items, got {len(items) if isinstance(items, list) else type(items)}")
            continue
        qns, ids = expected_numbers(c, b)
        base = BASE[c["variant"]]
        for i, it in enumerate(items):
            tag = f"{key} b{b} item {i + 1}"
            if not isinstance(it, dict):
                errs.append(f"{tag}: not an object"); continue
            want = set(base) | (CALC_ADD[c["variant"]] if it.get("isCalc") == "yes" else set())
            got = set(it.keys())
            if got != want:
                errs.append(f"{tag}: field set mismatch; missing={sorted(want - got)} extra={sorted(got - want)}")
            if it.get("bankKey") != c["bankKey"]:
                errs.append(f"{tag}: bankKey {it.get('bankKey')!r} != {c['bankKey']!r}")
            if it.get("questionNum") != qns[i]:
                errs.append(f"{tag}: questionNum {it.get('questionNum')!r} != {qns[i]}")
            if c["variant"] != "cand" and it.get("itemId") != ids[i]:
                errs.append(f"{tag}: itemId {it.get('itemId')!r} != {ids[i]}")
            want_calc = "yes" if i >= 40 else "no"
            if it.get("isCalc") != want_calc:
                errs.append(f"{tag}: isCalc {it.get('isCalc')!r} != {want_calc!r}")
            want_diff = ("easy" if i < 10 else "medium" if i < 30 else "hard") if i < 40 else ("medium" if i < 45 else "hard")
            if it.get("difficulty") != want_diff:
                warns.append(f"{tag}: difficulty {it.get('difficulty')!r} != planned {want_diff!r}")
            want_cog = "recall" if want_diff == "easy" else "application"
            if it.get("cognitiveLevel") != want_cog:
                warns.append(f"{tag}: cognitiveLevel {it.get('cognitiveLevel')!r} != {want_cog!r}")
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
            for k, v in it.items():
                if isinstance(v, str) and "\u2014" in v and k not in ("sourceTitle", "sourceReference"):
                    errs.append(f"{tag}: em dash in field {k}")
                # sourceTitle/sourceReference are bank-verbatim metadata and are
                # exempt: several existing bank source titles contain an em dash
                # and must be preserved exactly (schema fidelity).
                if isinstance(v, str) and "\u2013" in v and k in ("question", "explanation", "correctAnswer"):
                    warns.append(f"{tag}: en dash in field {k}")
            if it.get("isCalc") == "yes":
                if c["variant"] == "oit" and not str(it.get("formula", "")).strip():
                    errs.append(f"{tag}: calc item with empty formula")
                if c["variant"] in ("treat", "net", "cand") and it.get("steps"):
                    try:
                        st = json.loads(it["steps"])
                        assert isinstance(st, list) and all(set(x) == {"l", "c"} for x in st)
                    except Exception:
                        errs.append(f"{tag}: steps is not a JSON list of {{l, c}} entries")
                if c["variant"] == "cand":
                    cc = it.get("calculationCheck")
                    if not (isinstance(cc, dict) and set(cc) == {"value", "decimals", "unit"}):
                        errs.append(f"{tag}: calculationCheck malformed")
            if c["variant"] == "oit":
                want_stream = None
                seg = next(s for s in c["segments"] if b in s["batches"])
                want_stream = "Water Treatment" if "oit-water" in seg["label"] else "Wastewater Treatment"
                if it.get("stream") != want_stream:
                    errs.append(f"{tag}: stream {it.get('stream')!r} != {want_stream!r}")
        vf = d / f"batch-{b}.verify.json"
        if not vf.exists():
            errs.append(f"{key} batch {b}: verify file missing")
        else:
            try:
                recs = json.loads(vf.read_text())
                if len(recs) != 10:
                    errs.append(f"{key} batch {b}: verify file has {len(recs)} records, expected 10")
            except Exception as e:
                errs.append(f"{key} batch {b}: verify JSON parse error: {e}")
    return errs, warns

def main():
    keys = [sys.argv[1]] if len(sys.argv) > 1 else list(CFG)
    total_e = total_w = 0
    for key in keys:
        batches = [int(x) for x in sys.argv[2:]] or [1, 2, 3, 4]
        errs, warns = check_course(key, batches)
        total_e += len(errs); total_w += len(warns)
        for e in errs: print("ERROR", e)
        for w in warns: print("warn ", w)
        print(f"{key}: {len(errs)} errors, {len(warns)} warnings")
    print("TOTAL:", total_e, "errors,", total_w, "warnings")
    sys.exit(1 if total_e else 0)

if __name__ == "__main__":
    main()
