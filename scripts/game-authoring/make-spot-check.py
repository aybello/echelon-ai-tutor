"""Draws the spot-check sample from the live game content (committed overlays).

Usage: python3 -I scripts/game-authoring/make-spot-check.py [repo-root] [seed]
Defaults to the repo this script lives in. The sample is reproducible: same overlays and same seed give the same rows.
Writes docs/spot-check/*.csv. Content is read from committed files only. No database or network is used.
"""
import csv, glob, json, os, random, re, sys
from collections import defaultdict

SNAP = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(SNAP, "docs", "spot-check")
os.makedirs(OUT, exist_ok=True)
SEED = int(sys.argv[2]) if len(sys.argv) > 2 else 20261115

excl_raw = json.load(open(f"{SNAP}/server/interactiveContent/engine/releaseExclusions.json"))
excluded = set()
def collect(x):
    if isinstance(x, str): excluded.add(x)
    elif isinstance(x, list): [collect(i) for i in x]
    elif isinstance(x, dict): [collect(v) for v in x.values()]
collect(excl_raw)

pool = defaultdict(list)  # courseKey -> list of (file, difficulty, example)
files = sorted(glob.glob(f"{SNAP}/server/interactiveContent/overlay/*.json"))
for f in files:
    doc = json.load(open(f))
    for a in doc.get("additions", []):
        ex = a["example"]
        if ex["id"] in excluded: continue
        pool[a["courseKey"]].append((os.path.basename(f), a.get("difficulty", ""), ex))

SYSTEMS = {"water": "Water treatment", "ww": "Wastewater treatment", "water-dist": "Water distribution", "wastewater-coll": "Wastewater collection"}
MODES = ["rapid-swipe", "speed-match", "odd-one-out", "cause-effect", "tap-the-flaw", "before-after"]
MODE_LABEL = {"rapid-swipe": "Rapid swipe (true or false)", "speed-match": "Speed match", "odd-one-out": "Odd one out", "cause-effect": "Cause and effect", "tap-the-flaw": "Tap the flaw (find the wrong statement)", "before-after": "Before or after (which comes first)"}

def render(ex):
    m = ex["mode"]
    if m == "rapid-swipe":
        return "Yes (true) / No (false)", "Yes (true)" if ex["correctAnswer"] else "No (false)"
    if m == "speed-match":
        pairs = "\n".join(f'{p["left"]}  ->  {p["right"]}' for p in ex["pairs"])
        return pairs, "Every pair above is meant to be a correct match"
    labels = {o["id"]: o["label"] for o in ex.get("options", []) if isinstance(o, dict)}
    if m in ("odd-one-out", "tap-the-flaw", "cause-effect"):
        opts = "\n".join(f"{i+1}) {o['label']}" for i, o in enumerate(ex["options"]))
        return opts, labels[ex["correctOptionId"]]
    if m == "before-after":
        if "options" in ex:
            return "\n".join(f"{i+1}) {o}" for i, o in enumerate(ex["options"])), ex["correctAnswer"]
        return "Before / After", ex["correctAnswer"].capitalize()
    raise ValueError(m)

used_prompts = set()
rng = random.Random(SEED)

def draw(courseKey, n):
    """n items from one course, spread across modes, no repeated prompt anywhere in the sample."""
    by_mode = defaultdict(list)
    for entry in pool.get(courseKey, []):
        by_mode[entry[2]["mode"]].append(entry)
    base, extra = divmod(n, len(MODES))
    quota = {m: base for m in MODES}
    for m in rng.sample(MODES, extra): quota[m] += 1
    chosen = []
    for m in MODES:
        cands = by_mode[m][:]
        rng.shuffle(cands)
        got = 0
        for entry in cands:
            key = entry[2]["prompt"].strip().lower()
            if key in used_prompts: continue
            used_prompts.add(key); chosen.append(entry); got += 1
            if got == quota[m]: break
    return chosen

COLUMNS = ["sample_id", "course", "system", "mode", "difficulty", "item_id", "source_overlay", "prompt", "options_or_pairs", "marked_correct", "explanation", "verdict", "correction_or_note", "reviewer"]
summary = []
def write(name, label, courses, per_course):
    rows = []
    for courseKey, system in courses:
        for entry in draw(courseKey, per_course):
            ex = entry[2]
            opts, correct = render(ex)
            rows.append([None, courseKey, system, MODE_LABEL[ex["mode"]], entry[1], ex["id"], entry[0], ex["prompt"], opts, correct, ex.get("explanation", ""), "", "", ""])
    rng.shuffle(rows)  # mix systems so a reviewer is not on one topic for 25 rows in a row
    for i, r in enumerate(rows, 1): r[0] = f"{name.upper()}-{i:03d}"
    with open(f"{OUT}/{name}.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh); w.writerow(COLUMNS); w.writerows(rows)
    summary.append((name, label, len(rows)))

for c in (1, 2, 3, 4):
    write(f"class{c}", f"Class {c}", [(f"class{c}-{k}", v) for k, v in SYSTEMS.items()], 25)
write("oit-water", "OIT water", [("oit", "OIT water")], 50)
write("oit-wastewater", "OIT wastewater", [("oit-ww", "OIT wastewater")], 50)

tot = sum(n for _, _, n in summary)
print("excluded ids:", len(excluded), " pool sizes:", {k: len(v) for k, v in sorted(pool.items()) if k.startswith(("class", "oit"))})
for name, label, n in summary: print(f"{name}.csv  {label}: {n} items")
print("total", tot, "unique prompts", len(used_prompts))
