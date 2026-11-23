#!/usr/bin/env python3
"""Duplicate screening for the gap-to-1000 build.

Corpus per bank ("existing"): the seed files named in the Nov 22
courses_data dedup lists for that bank (transcribed verbatim into
gap_config.json dedupSeedFiles; verified identical for all 26 banks)
AND the Nov 22 staged additions for the bank (all 200; production
inserted 6,988 of 7,000, dedupe is conservative). NOTE: the production
seed banks live in the database, not the repo; no live-bank export
exists, so this corpus is the repo packages plus the full Nov 22 set,
the same scope the Nov 22 build used, plus the Nov 22 additions.

Checks for every new item:
- exact duplicate: identical normalized stem vs corpus, vs other new items
  in the same bank, and (exact only) vs new items in other banks.
- near duplicate: numbers masked to '#', token-set Jaccard >= 0.85 vs
  corpus stems and vs other new stems in the same bank. The new-versus-new
  check is a full pairwise comparison of masked token sets; identical
  masked text is the Jaccard 1.0 special case of the same check.
- calculation duplicate: identical normalized expression string vs corpus
  or within the new set.
- answer-option collision: identical normalized set of 4 options vs corpus
  or within the new set.

Corpus locations resolve relative to the package root's parent directory
(the echelon folder that holds echelon-ai-tutor/content and
exam-bank-expansion), with env overrides GAP_DEDUP_BANKS_DIR and
GAP_DEDUP_NOV22_DIR, falling back to the home-based paths when the
relative ones do not exist. Every file listed in a bank's dedupSeedFiles
and the bank's Nov 22 additions file are REQUIRED: a missing required
file aborts the run with a clear error and a nonzero exit code.

Each bank's report entry records the corpus files used (stable path
identifier, sha256, item count), the corpus digest, the checker identity
and hash, the config hash, and a payload digest over the bank's new
items, so a report can be tied to the exact corpus and code that made it.

Usage: dedup_gap.py [courseKey ...]  (default: all)
Writes tools/dedup-report.json. With explicit bank arguments the results
are MERGED into the existing report (only those banks are updated); a
no-argument run recomputes every bank. Exit 1 on hard duplicates (exact,
expression, option-set). Near duplicates are reported for review.
"""
import hashlib, json, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "gap_config.json").read_text())
JACCARD_THRESHOLD = 0.85

def _resolve_dir(env_name, relative_parts, fallback):
    env = os.environ.get(env_name)
    if env:
        return Path(env).expanduser()
    rel = ROOT.parent.joinpath(*relative_parts)
    if rel.exists():
        return rel
    return fallback

BANKS = _resolve_dir("GAP_DEDUP_BANKS_DIR", ("echelon-ai-tutor", "content"),
                     Path.home() / "workspace/echelon-ai-tutor/content")
NOV22 = _resolve_dir("GAP_DEDUP_NOV22_DIR", ("exam-bank-expansion",),
                     Path.home() / "workspace/echelon/exam-bank-expansion")

def norm(s):
    s = str(s).lower()
    s = re.sub(r"[^a-z0-9# ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def masked(s):
    return norm(re.sub(r"\d+(?:\.\d+)?", "#", str(s)))

def jaccard(a, b):
    sa, sb = set(a.split()), set(b.split())
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)

def optset(it):
    opts = it.get("options") or []
    return tuple(sorted(norm(o) for o in opts)) if len(opts) == 4 else None

def expr_of(it):
    for f in ("expression", "calculationExpression"):
        if it.get(f):
            return re.sub(r"\s+", "", str(it[f]))
    return None

def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()

def sha_file(p):
    return sha_bytes(p.read_bytes())

def payload_hash(it):
    canon = json.dumps(it, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return sha_bytes(canon)

def load_new(key):
    items = []
    d = ROOT / key
    for b in CFG[key]["batches"]:
        f = d / f"batch-{b['batch']}.json"
        if f.exists():
            items += json.loads(f.read_text())
    return items

def _require(path, bank, label):
    if not path.exists():
        print(f"ERROR: bank {bank}: required corpus file missing: {label} (looked for {path})", file=sys.stderr)
        sys.exit(2)

_corpus_cache = {}
def load_corpus(key):
    """Returns (items, corpus_meta). Required files abort the run if missing."""
    if key in _corpus_cache:
        return _corpus_cache[key]
    c = CFG[key]
    items, seen = [], set()
    files_meta = []
    def add(it):
        sig = (it.get("bankKey"), norm(it.get("question", "")))
        if sig not in seen:
            seen.add(sig)
            items.append(it)
    # seed files named in the Nov 22 config (REQUIRED)
    for rel in c["dedupSeedFiles"]:
        p = BANKS / rel
        label = f"echelon-ai-tutor/content/{rel}"
        _require(p, key, label)
        raw = json.loads(p.read_text())
        files_meta.append({"path": label, "sha256": sha_file(p), "items": len(raw)})
        for it in raw:
            add(it)
    # Nov 22 additions for this bank (workspace staging == repo staging) (REQUIRED)
    f = NOV22 / key / "additions.json"
    label = f"exam-bank-expansion/{key}/additions.json"
    _require(f, key, label)
    raw = json.loads(f.read_text())
    files_meta.append({"path": label, "sha256": sha_file(f), "items": len(raw)})
    for it in raw:
        add(it)
    corpus_meta = {"files": files_meta, "totalItems": len(items),
                   "corpusSha256": sha_bytes("".join(m["sha256"] for m in files_meta).encode("utf-8"))}
    _corpus_cache[key] = (items, corpus_meta)
    return items, corpus_meta

def load_global_nov22_exact():
    """Exact-stem pool across ALL Nov 22 additions (35 courses, 7,000 items).
    Production inserted 6,988 of them; dedupe conservatively against all."""
    if not NOV22.exists():
        print(f"ERROR: Nov 22 corpus directory missing: {NOV22}", file=sys.stderr)
        sys.exit(2)
    pool = {}
    for d in sorted(NOV22.iterdir()):
        f = d / "additions.json"
        if f.exists():
            for it in json.loads(f.read_text()):
                pool.setdefault(norm(it.get("question", "")), []).append(d.name)
        for extra in ("additions-water.json", "additions-wastewater.json"):
            f2 = d / extra
            if f2.exists():
                for it in json.loads(f2.read_text()):
                    pool.setdefault(norm(it.get("question", "")), []).append(d.name)
    return pool

def main():
    args = sys.argv[1:]
    partial = bool(args)
    keys = args or list(CFG)
    checker_sha = sha_file(Path(__file__).resolve())
    config_sha = sha_file(ROOT / "gap_config.json")
    all_new = {k: load_new(k) for k in CFG}
    global_exact = load_global_nov22_exact()
    # cross-bank exact stem pool
    cross_pool = {}
    for k, items in all_new.items():
        for it in items:
            cross_pool.setdefault(norm(it["question"]), []).append((k, it.get("itemId")))
    report = {}
    hard_total = 0
    for key in keys:
        c = CFG[key]
        new = all_new[key]
        existing, corpus_meta = load_corpus(key)
        ex_norm = {norm(x["question"]) for x in existing}
        ex_masked = [masked(x["question"]) for x in existing]
        ex_masked_tok = [set(m.split()) for m in ex_masked]
        # inverted index: token -> corpus indices (only tokens len>=3)
        inv = {}
        for idx, toks in enumerate(ex_masked_tok):
            for t in toks:
                if len(t) >= 3:
                    inv.setdefault(t, []).append(idx)
        ex_expr = {expr_of(x) for x in existing} - {None}
        ex_opts = {optset(x) for x in existing} - {None}
        exact, near, expr_dups, opt_dups, cross = [], [], [], [], []
        seen_norm, seen_expr, seen_opts = {}, {}, {}
        # new-versus-new masked-token Jaccard: full pairwise comparison.
        # Identical masked text is the Jaccard 1.0 special case.
        new_refs = [(it.get("itemId") or str(it.get("questionNum"))) for it in new]
        new_toks = [set(masked(it["question"]).split()) for it in new]
        for i in range(len(new)):
            for j in range(i + 1, len(new)):
                union = len(new_toks[i] | new_toks[j])
                if not union:
                    continue
                sim = len(new_toks[i] & new_toks[j]) / union
                if sim >= JACCARD_THRESHOLD:
                    near.append({"a": new_refs[i], "b": new_refs[j],
                                 "similarity": round(sim, 4), "type": "new-vs-new"})
        for it in new:
            q = it["question"]
            n, m = norm(q), masked(q)
            ref = it.get("itemId") or str(it.get("questionNum"))
            if n in ex_norm:
                exact.append(f"{ref}: exact match vs existing bank: {q[:80]}")
            if n in seen_norm:
                exact.append(f"{ref}: exact duplicate of new item {seen_norm[n]}")
            seen_norm[n] = ref
            owners = cross_pool.get(n, [])
            if len(owners) > 1 and any(k2 != key for k2, _ in owners):
                cross.append(f"{ref}: exact stem also in another bank's new set: {owners}")
            gowners = global_exact.get(n, [])
            if gowners and key not in gowners:
                cross.append(f"{ref}: exact stem match vs Nov 22 additions of {gowners}")
            cand = set()
            for t in set(m.split()):
                if len(t) >= 3:
                    cand.update(inv.get(t, []))
            mtoks = set(m.split())
            for idx in cand:
                inter = len(mtoks & ex_masked_tok[idx])
                union = len(mtoks | ex_masked_tok[idx])
                if union and inter / union >= JACCARD_THRESHOLD:
                    near.append(f"{ref}: near-dup vs existing bank (J={inter / union:.4f} >= 0.85): {q[:60]}")
                    break
            e = expr_of(it)
            if e:
                if e in ex_expr:
                    expr_dups.append(f"{ref}: expression duplicates existing bank: {e}")
                if e in seen_expr:
                    expr_dups.append(f"{ref}: expression duplicates new item {seen_expr[e]}: {e}")
                seen_expr[e] = ref
            os_ = optset(it)
            if os_:
                if os_ in ex_opts:
                    opt_dups.append(f"{ref}: option set identical to an existing bank item")
                if os_ in seen_opts:
                    opt_dups.append(f"{ref}: option set identical to new item {seen_opts[os_]}")
                seen_opts[os_] = ref
        payload_digest = sha_bytes("".join(payload_hash(it) for it in sorted(new, key=lambda x: x["questionNum"])).encode("utf-8"))
        report[key] = {"new_items": len(new), "existing_corpus_items": len(existing),
                       "exact": exact, "near": near, "expression_dups": expr_dups,
                       "option_collisions": opt_dups, "cross_bank_exact": cross,
                       "corpus": corpus_meta,
                       "config": {"jaccardThreshold": JACCARD_THRESHOLD, "checker": "dedup_gap.py",
                                  "checkerSha256": checker_sha},
                       "payloadDigest": payload_digest, "configSha256": config_sha}
        hard = len(exact) + len(expr_dups) + len(opt_dups) + len(cross)
        hard_total += hard
        print(f"{key}: {len(new)} new vs {len(existing)} existing | exact {len(exact)}, near {len(near)}, expr {len(expr_dups)}, optcol {len(opt_dups)}, cross {len(cross)}")
        for label, lst in (("EXACT", exact), ("NEAR", near), ("EXPR", expr_dups), ("OPTCOL", opt_dups), ("CROSS", cross)):
            for x in lst[:15]:
                print(f"  {label}", x)
    out_path = Path(__file__).parent / "dedup-report.json"
    if partial and out_path.exists():
        merged = json.loads(out_path.read_text())
        merged.update(report)
        report = merged
    out_path.write_text(json.dumps(report, indent=1))
    print("TOTAL hard duplicates:", hard_total)
    sys.exit(1 if hard_total else 0)

if __name__ == "__main__":
    main()
