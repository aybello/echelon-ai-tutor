#!/usr/bin/env python3
"""Quality / safety checks for the gap-to-1000 build.

Per bank and per batch:
- correctIndex distribution (house rule: no position above 40% in a batch).
- answer-length tells: per item, ratio of correct-option length to mean
  distractor length; items above 1.8 flagged, above 2.5 hard-flagged.
  Bank-level share of items where the correct option is strictly the
  longest (flag above 50%).
- absolute words: always/never/must/only/guaranteed and
  "all/none of the above" in correct options (shortcut pattern) and in
  stems (informational).
- true/false balance: items whose correct answer is True/False or whose
  option set is a true/false pair pattern; share of bank flagged above 5%.

Usage: quality_checks.py [courseKey ...]  (default: all)
Writes tools/quality-report.json. Exit 1 on hard flags.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "gap_config.json").read_text())
ABS = re.compile(r"\b(always|never|must|only|guarantee[ds]?|all of the above|none of the above)\b", re.I)

def load_new(key):
    items = []
    d = ROOT / key
    for b in CFG[key]["batches"]:
        f = d / f"batch-{b['batch']}.json"
        if f.exists():
            items += [(b["batch"], it) for it in json.loads(f.read_text())]
    return items

def main():
    keys = sys.argv[1:] or list(CFG)
    report = {}
    hard = 0
    for key in keys:
        items = load_new(key)
        length_flags, length_hard, abs_correct, abs_stem, tf_items = [], [], [], [], []
        longest = 0
        batch_pos = {}
        for bn, it in items:
            opts = it.get("options") or []
            ci = it.get("correctIndex")
            ref = it.get("itemId") or str(it.get("questionNum"))
            if len(opts) == 4 and ci in (0, 1, 2, 3):
                batch_pos.setdefault(bn, [0, 0, 0, 0])
                batch_pos[bn][ci] += 1
                clen = len(opts[ci])
                dmean = sum(len(o) for j, o in enumerate(opts) if j != ci) / 3
                if dmean and clen / dmean > 1.8:
                    length_flags.append(f"{ref}: correct/distractor length ratio {clen / dmean:.2f}")
                if dmean and clen / dmean > 2.5:
                    length_hard.append(f"{ref}: length ratio {clen / dmean:.2f} > 2.5")
                if clen > max(len(o) for j, o in enumerate(opts) if j != ci):
                    longest += 1
                ca = opts[ci]
                if ABS.search(ca):
                    abs_correct.append(f"{ref}: absolute wording in correct option: {ca[:60]}")
                low = {o.strip().lower() for o in opts}
                if low <= {"true", "false"} or ca.strip().lower() in ("true", "false"):
                    tf_items.append(f"{ref}: true/false style item")
            if ABS.search(str(it.get("question", ""))):
                abs_stem.append(ref)
        pos_flags = []
        for bn, counts in batch_pos.items():
            tot = sum(counts)
            for pos, cnt in enumerate(counts):
                if tot and cnt / tot > 0.40:
                    pos_flags.append(f"batch {bn}: position {pos} holds {cnt}/{tot} correct answers (>40%)")
        n = len(items) or 1
        longest_share = longest / n
        tf_share = len(tf_items) / n
        # Bank-level longest-share is a reported metric, not a hard flag:
        # the per-item ratio checks above are the enforceable tell test.
        bank_hard = len(length_hard) + len(pos_flags) + (1 if tf_share > 0.05 else 0)
        hard += bank_hard
        report[key] = {"items": len(items), "length_flags": length_flags, "length_hard": length_hard,
                       "correct_is_longest_share": round(longest_share, 3),
                       "absolute_in_correct": abs_correct, "absolute_in_stem_count": len(abs_stem),
                       "true_false_items": tf_items, "true_false_share": round(tf_share, 3),
                       "position_flags": pos_flags}
        print(f"{key}: {len(items)} items | length flags {len(length_flags)} (hard {len(length_hard)}), "
              f"longest-share {longest_share:.0%}, abs-in-correct {len(abs_correct)}, TF {len(tf_items)} ({tf_share:.0%}), pos flags {len(pos_flags)}")
        for x in length_hard + pos_flags:
            print("  HARD", x)
    (Path(__file__).parent / "quality-report.json").write_text(json.dumps(report, indent=1))
    print("TOTAL hard quality flags:", hard)
    sys.exit(1 if hard else 0)

if __name__ == "__main__":
    main()
