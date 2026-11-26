# SPEC: class3-water-dist exam-bank expansion (200 new questions)

- courseKey: class3-water-dist
- bankKey (use in every item): class3-water-dist
- Destination bank: class3-water-dist bank (bankKey class3-water-dist)
- Schema variant: cand
- Family: ontario; track: water-distribution; level: 3

## Schema variant rules

Field set (EXACTLY these fields, no more, no fewer):
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
- sourceReference: one-line scope note for the cited source.

## Example conceptual item (from the existing bank; copy its shape exactly)

```json
{
 "bankKey": "class3-water-dist",
 "questionNum": 2001,
 "module": "General",
 "difficulty": "hard",
 "question": "Two monitoring points on the same static, connected main show the same gauge pressure. One point is 18 m higher in elevation. Ignoring minor local losses, which point has the higher hydraulic grade line (HGL)?",
 "options": [
  "The higher-elevation point has the higher HGL.",
  "The lower-elevation point has the higher HGL because water flows downhill.",
  "Both points have the same HGL because their gauge pressures are equal.",
  "The point nearest the source has the higher HGL regardless of elevation."
 ],
 "correctIndex": 0,
 "explanation": "HGL is the sum of elevation head and pressure head. With equal gauge pressure, the higher-elevation point has the greater HGL.",
 "steps": null,
 "tip": null,
 "isCalc": "no",
 "topic": "Monitor pressure and elevation",
 "cognitiveLevel": "application",
 "sourceTitle": "EPA EPANET: Application for Modeling Drinking Water Distribution Systems",
 "sourceReference": "Supports use of elevation and pressure head in network hydraulic analysis.",
 "sourceUrl": "https://www.epa.gov/water-research/epanet",
 "blueprintObjective": "Distribution System Components: Monitor pressure and elevation",
 "reviewStatus": "in_review",
 "reviewedBy": null,
 "reviewedAt": null
}
```

## Example calculation item (from the existing bank)

```json
{
 "bankKey": "class3-water-dist",
 "questionNum": 2049,
 "module": "General",
 "difficulty": "medium",
 "question": "A single 300 mm inside-diameter main is 420 m long. What volume of water does it hold? Use π = 3.1416 and assume a full, uniform circular pipe.",
 "options": [
  "29.7 m³",
  "9.4 m³",
  "59.4 m³",
  "118.8 m³"
 ],
 "correctIndex": 0,
 "explanation": "The nominal pipe volume is cross-sectional area multiplied by length. This simplified calculation uses the stated inside diameter and assumes the main is full.",
 "steps": "[{\"l\":\"Formula\",\"c\":\"V = πD²L ÷ 4, where V is volume (m³), D is inside diameter (m), and L is pipe length (m).\"},{\"l\":\"Substitution\",\"c\":\"V = 3.1416 × (0.300 m)² × 420 m ÷ 4.\"},{\"l\":\"Result\",\"c\":\"V = 29.7 m³ (rounded to one decimal place).\"}]",
 "tip": null,
 "isCalc": "yes",
 "topic": "Determine main volume",
 "cognitiveLevel": "application",
 "sourceTitle": "EPA EPANET: Application for Modeling Drinking Water Distribution Systems",
 "sourceReference": "Supports pipe geometry inputs and distribution-system hydraulic calculations.",
 "sourceUrl": "https://www.epa.gov/water-research/epanet",
 "blueprintObjective": "Distribution System Components: Determine main volume",
 "reviewStatus": "in_review",
 "reviewedBy": null,
 "reviewedAt": null,
 "calculationCheck": {
  "value": 29.688050576423546,
  "decimals": 1,
  "unit": "m³"
 }
}
```

## Numbering

- Batch 1: class3-water-dist bank additions; questionNum 2251 to 2300; no itemId in this variant.
- Batch 2: class3-water-dist bank additions; questionNum 2301 to 2350; no itemId in this variant.
- Batch 3: class3-water-dist bank additions; questionNum 2351 to 2400; no itemId in this variant.
- Batch 4: class3-water-dist bank additions; questionNum 2401 to 2450; no itemId in this variant.

## Modules allowed for this course

General, Processes, Support Systems, Administration

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA — EPANET hydraulic modelling | https://www.epa.gov/water-research/epanet
- US EPA — Cross-Connection Control Manual | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=2000262T.TXT
- US EPA - Small Drinking Water Systems Handbook | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT
- Ontario Regulation 170/03 - Drinking Water Systems | https://www.ontario.ca/laws/regulation/030170
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html
- WPI: 2025 Need-to-Know criteria | https://gowpi.org/services/2025-need-to-know-criteria/

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Administration] multi-zone system management
- [Processes] system water quality management
- [Support Systems] elevated storage at system scale
- [Processes] residual maintenance strategy
- [General] water loss accounting awareness
- [Administration] sampling program design
- [Processes] adverse response at system scale
- [Support Systems] pumping energy management
Calculation topics (10 items spread across these; every result an exact decimal):
- zone demand with peaking factors
- water loss audit percentage with given volumes
- pump energy and wire to water efficiency
- storage turnover and water age

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [General] main break leadership
- [Administration] cross-connection program leadership
- [Processes] nitrification in storage response
- [Support Systems] pressure zone operations depth
- [Administration] asset management awareness
- [General] leak detection programs
- [Processes] flushing strategy at scale
- [Administration] ORO duties awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- flushing volume at system scale
- booster dosing with given rates
- pressure and head conversions
- sampling program counts

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Processes] water quality trending
- [Support Systems] storage inspection programs
- [Administration] capital planning awareness
- [General] emergency response leadership
- [Processes] chlorine decay management
- [Support Systems] SCADA and data systems
- [Administration] inspection readiness
- [General] hydrant and valve program leadership
Calculation topics (10 items spread across these; every result an exact decimal):
- zone storage sizing quantity
- loss component quantity
- energy benchmarking per volume
- dose quantity with given factors

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Administration] regulatory leadership
- [Processes] system optimization studies
- [General] asset condition programs
- [Support Systems] energy strategy awareness
- [Administration] team supervision
- [Processes] complaint pattern analysis
- [General] renewal program awareness
- [Administration] continuous improvement
Calculation topics (10 items spread across these; every result an exact decimal):
- demand forecast with given growth factors
- turnover program volume
- sampling schedule counts
- pump fleet energy quantity

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 3 Water Distribution grounding (courseKey class3-water-dist)

The repo holds a partial Class 3 distribution structure
(content/class3-water-dist), and the closest complete matching bank
structure is content/class1-networks (the bank used for
class1-water-dist), deepened through the Class 2 build to the Class 3
scope in the OWWCO and WPI Need-to-Know progression. Scope for this
build: large and multi-zone distribution system management, pressure
zone and elevated storage operations at system scale, system water
quality management (residual maintenance, nitrification awareness in
storage, turnover management), regulatory sampling program design and
adverse response at system scale, advanced leak detection and water
loss accounting with given audit values, main break and emergency
response leadership, cross connection control program administration,
asset management and capital planning awareness, energy management for
pumping, supervisory and overall responsible operator duties awareness,
and Ontario Regulation 170/03 at the Class 3 level. Calculation
vocabulary: zone demand and peaking calculations with given factors,
storage volume, turnover and water age style calculations with given
values, pump energy and wire to water efficiency with given values,
water loss audit components and percentages with given volumes,
chlorine decay and booster dosing with given rates (no exponential
numerics; use given per day factors), pressure and head conversions,
flushing volumes and velocities with given dimensions, sampling program
counts and schedules. Use given values and factors so every result is
an exact decimal; no exponential or logarithmic numerics and no
Hazen-Williams. Id prefix for this course: c3wd (c3wd-ladder01..100,
c3wd-process01..100, c3wd-error01..100, c3wd-evidence01..100,
c3wd-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class3 level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA
Small Drinking Water Systems Handbook, US EPA Cross-Connection Control
Manual, US EPA EPANET and manual, OWWCO exam preparation resources,
WPI Water Distribution Class III Need-to-Know Criteria, Ontario
Regulation 170/03, CCOHS safety guidance.
