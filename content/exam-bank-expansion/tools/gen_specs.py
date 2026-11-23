#!/usr/bin/env python3
"""Generate per-course SPEC.md for the exam-bank expansion build."""
import json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from courses_data import COURSES

ROOT = Path.home() / "workspace/echelon/exam-bank-expansion"
BRIEF = (Path.home() / "workspace/echelon/game-content/AUTHORING-BRIEF.md").read_text()
BANKS = Path.home() / "workspace/echelon-ai-tutor/content"

def brief_section(key):
    parts = re.split(r"\n## ", BRIEF)
    for p in parts[1:]:
        head = p.split("\n", 1)[0]
        if f"(courseKey {key})" in head:
            return "## " + p.rstrip()
    special = {"oit": "OIT course grounding", "class1-water": "Class 1 Water grounding"}
    if key in special:
        for p in parts[1:]:
            if p.startswith(special[key]):
                return "## " + p.rstrip()
    return "(grounding section not found in brief; follow the topic plan and source list in this SPEC)"

def example_items(variant):
    def load(p):
        return json.loads((BANKS / p).read_text())
    if variant == "oit":
        d = load("oit/questions/oit-water-500.json")
        return d[0], [x for x in d if x["isCalc"] == "yes"][0]
    if variant == "treat":
        d = load("class1-treatment/questions/water-250.json")
        return d[0], [x for x in d if x["isCalc"] == "yes"][0]
    if variant == "net":
        d = load("class1-networks/questions/distribution-250.json")
        return d[0], [x for x in load("class1-networks/questions/collection-250.json") if x["isCalc"] == "yes"][0]
    d = load("class3-water-dist/candidate-250-2026-09-22.json")
    return d[0], [x for x in d if x["isCalc"] == "yes"][0]

VARIANT_RULES = {
"oit": """Field set (EXACTLY these fields, no more, no fewer):
questionNum, bankKey, stream, module, topic, difficulty, cognitiveLevel,
question, optionA, optionB, optionC, optionD, options, correctIndex,
correctAnswer, explanation, isCalc, formula, sourceTitle, sourceReference,
sourceUrl, blueprintObjective, reviewStatus, itemId.
- stream: "Water Treatment" for the water bank, "Wastewater Treatment" for the wastewater bank.
- topic: short lowercase phrase, bank style (e.g. "source-water assessment").
- formula: "" for conceptual items; the governing formula text for calc items.
- blueprintObjective: "<stream> - <module> - <topic>".
- sourceReference: "<one-line scope note for the cited source> - <stream> / <module> / <topic>". Use a plain hyphen, never an em dash.
- reviewStatus: "unreviewed".
- Calc items carry NO expression fields in this variant; the machine-checkable record goes in the batch verify file (see WORKER-BRIEF).""",
"treat": """Field set (EXACTLY these fields, no more, no fewer):
topic, question, correctAnswer, explanation, isCalc, bankKey, questionNum,
itemId, module, options, correctIndex, reviewStatus, difficulty,
cognitiveLevel, sourceTitle, sourceUrl, sourceReference, blueprintObjective,
evidenceStatus, optionA, optionB, optionC, optionD.
Calc items ADD exactly these fields: formula, expression, expected,
decimalPlaces, unit, steps, tip.
- topic: short Title Case phrase (e.g. "Flow conversion").
- blueprintObjective: exactly the topic text.
- evidenceStatus: "original-candidate-topic-reference-not-independent-SME-certification".
- sourceReference: "Supporting resource category: <topic>. See SOURCES.md: these are not claim-level verification citations."
- reviewStatus: "unreviewed".
- steps: a JSON string encoding a list of {"l": label, "c": content} entries with labels "Relationship", "Substitution", "Result".
- tip: "Check dimensional consistency and round only the final result." or a similar short study tip.""",
"net": """Field set (EXACTLY these fields, no more, no fewer):
questionNum, bankKey, itemId, module, topic, question, correctAnswer,
explanation, isCalc, formula, options, optionA, optionB, optionC, optionD,
correctIndex, difficulty, cognitiveLevel, sourceTitle, sourceUrl,
sourceReference, blueprintObjective, reviewStatus, evidenceStatus.
Calc items ADD exactly these fields: calculationExpression, decimalPlaces,
unit, steps. (No "expected" field in this variant; the expected value goes in
the batch verify file.)
- topic: short Title Case phrase.
- formula: "" for conceptual items; the governing formula text for calc items.
- blueprintObjective: "<module>: <topic>".
- evidenceStatus: "original-practice-item-with-supporting-topic-reference".
- sourceReference: "Supporting topic reference: <topic>."
- reviewStatus: "unreviewed".
- steps: a JSON string encoding a list of {"l": label, "c": content} entries with labels "Relationship", "Substitute stated values", "Final answer".""",
"cand": """Field set (EXACTLY these fields, no more, no fewer):
bankKey, questionNum, module, difficulty, question, options, correctIndex,
explanation, steps, tip, isCalc, topic, cognitiveLevel, sourceTitle,
sourceReference, sourceUrl, blueprintObjective, reviewStatus, reviewedBy,
reviewedAt. Calc items ADD exactly one field: calculationCheck.
- NO itemId and NO optionA-D fields in this variant.
- steps and tip: null for conceptual items. For calc items, steps is a JSON
  string encoding a list of {"l": label, "c": content} entries with labels
  "Formula", "Substitution", "Result"; tip stays null.
- calculationCheck: {"value": <the unrounded numeric result as a JSON number>, "decimals": <decimalPlaces>, "unit": "<unit>"}.
- reviewStatus: "in_review"; reviewedBy: null; reviewedAt: null.
- topic: short phrase, bank style (e.g. "Determine main volume").
- blueprintObjective: "<module area>: <topic>" following the example item.
- sourceReference: one-line scope note for the cited source.""",
}

def numbering(course):
    lines = []
    for s in course["segments"]:
        for b in s["batches"]:
            first_item = (b - 1) * 50 + 1
            seg_offset = (b - s["batches"][0]) * 50
            qn_first = s["qnBase"] + seg_offset
            id_first = course["itemStart"] + first_item - 1
            if course["variant"] == "cand":
                idtxt = "no itemId in this variant"
            else:
                idtxt = "itemId " + course["itemFmt"] % id_first + " to " + course["itemFmt"] % (id_first + 49)
            lines.append(f"- Batch {b}: {s['label']}; questionNum {qn_first} to {qn_first + 49}; {idtxt}.")
    return "\n".join(lines)

def batch_plan(course):
    out = []
    for b in range(1, 5):
        topics, calcs = course["batches"][b - 1]
        out.append(f"### Batch {b} (50 items: 40 conceptual, then 10 calculation)")
        if topics:
            out.append("Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):")
            for t in topics:
                out.append(f"- {t}")
        else:
            out.append("Conceptual topics: none (this batch is not used for this course segment).")
        if calcs:
            out.append("Calculation topics (10 items spread across these; every result an exact decimal):")
            for t in calcs:
                out.append(f"- {t}")
        out.append("")
    return "\n".join(out)

def main():
    for c in COURSES:
        d = ROOT / c["key"]
        d.mkdir(parents=True, exist_ok=True)
        ex1, ex2 = example_items(c["variant"])
        src = "\n".join(f"- {t} | {u}" for t, u in c["sources"])
        mods = ", ".join(c["modules"])
        spec = f"""# SPEC: {c['key']} exam-bank expansion (200 new questions)

- courseKey: {c['key']}
- bankKey (use in every item): {c['bankKey']}
- Destination bank: {c['dest']}
- Schema variant: {c['variant']}
- Family: {c['family']}; track: {c['track']}; level: {c['level']}

## Schema variant rules

{VARIANT_RULES[c['variant']]}

## Example conceptual item (from the existing bank; copy its shape exactly)

```json
{json.dumps(ex1, indent=1, ensure_ascii=False)}
```

## Example calculation item (from the existing bank)

```json
{json.dumps(ex2, indent=1, ensure_ascii=False)}
```

## Numbering

{numbering(c)}

## Modules allowed for this course

{mods}

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

{src}

## Batch plan

{batch_plan(c)}
## Grounding (from the game build AUTHORING-BRIEF; binding)

{brief_section(c['key'])}
"""
        (d / "SPEC.md").write_text(spec)
        print("wrote", c["key"])
    print("done", len(COURSES))

if __name__ == "__main__":
    main()
