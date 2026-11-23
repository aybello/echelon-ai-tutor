# SPEC: class1-water-dist exam-bank expansion (200 new questions)

- courseKey: class1-water-dist
- bankKey (use in every item): class1-water-dist
- Destination bank: content/class1-networks/questions/distribution-250.json
- Schema variant: net
- Family: ontario; track: water-distribution; level: 1

## Schema variant rules

Field set (EXACTLY these fields, no more, no fewer):
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
- steps: a JSON string encoding a list of {"l": label, "c": content} entries with labels "Relationship", "Substitute stated values", "Final answer".

## Example conceptual item (from the existing bank; copy its shape exactly)

```json
{
 "questionNum": 2001,
 "bankKey": "class1-water-dist",
 "itemId": "DISTRIBUTION-L1-001",
 "module": "General",
 "topic": "Network hydraulics",
 "question": "Two closed service taps share one pressure zone. Which location normally has lower static pressure?",
 "correctAnswer": "The tap at higher elevation",
 "explanation": "With the same hydraulic grade, greater elevation leaves less pressure head.",
 "isCalc": "no",
 "formula": "",
 "options": [
  "The tap with a shorter service",
  "The tap at higher elevation",
  "The tap with a newer meter",
  "The tap nearest a large main"
 ],
 "optionA": "The tap with a shorter service",
 "optionB": "The tap at higher elevation",
 "optionC": "The tap with a newer meter",
 "optionD": "The tap nearest a large main",
 "correctIndex": 1,
 "difficulty": "easy",
 "cognitiveLevel": "recall",
 "sourceTitle": "US EPA — EPANET hydraulic modelling",
 "sourceUrl": "https://www.epa.gov/water-research/epanet",
 "sourceReference": "Supporting topic reference: Network hydraulics. See README for source scope and limitations.",
 "blueprintObjective": "General: Network hydraulics",
 "reviewStatus": "unreviewed",
 "evidenceStatus": "original-practice-item-with-supporting-topic-reference"
}
```

## Example calculation item (from the existing bank)

```json
{
 "questionNum": 2201,
 "bankKey": "class1-wastewater-coll",
 "itemId": "COLLECTION-L1-201",
 "module": "Monitor, Evaluate & Adjust Collection System",
 "topic": "Applied operating calculations",
 "question": "A sewer carries a constant 35 L/s for one day. What volume passes? Use 86,400 seconds/day and 1,000 L/m³.",
 "correctAnswer": "3024 m³/day",
 "isCalc": "yes",
 "formula": "V = Q × 86400/1000",
 "calculationExpression": "35*86400/1000",
 "decimalPlaces": 0,
 "unit": "m³/day",
 "explanation": "V = Q × 86400/1000. Substitute the stated values: 35 × 86400 ÷ 1000 = 3024 m³/day. Round only the final result to 0 decimal place(s). The result uses the assumptions stated in the question.",
 "steps": "[{\"l\":\"Relationship\",\"c\":\"V = Q × 86400/1000\"},{\"l\":\"Substitute stated values\",\"c\":\"35 × 86400 ÷ 1000\"},{\"l\":\"Final answer\",\"c\":\"3024 m³/day\"}]",
 "options": [
  "30240 m³/day",
  "2100 m³/day",
  "3024 m³/day",
  "3500 m³/day"
 ],
 "optionA": "30240 m³/day",
 "optionB": "2100 m³/day",
 "optionC": "3024 m³/day",
 "optionD": "3500 m³/day",
 "correctIndex": 2,
 "difficulty": "medium",
 "cognitiveLevel": "application",
 "sourceTitle": "WPI — Wastewater Collection Class I Need-to-Know Criteria",
 "sourceUrl": "https://gowpi.org/services/2025-need-to-know-criteria/",
 "sourceReference": "Supporting topic reference: Applied operating calculations. See README for source scope and limitations.",
 "blueprintObjective": "Monitor, Evaluate & Adjust Collection System: Applied operating calculations",
 "reviewStatus": "unreviewed",
 "evidenceStatus": "original-practice-item-with-supporting-topic-reference"
}
```

## Numbering

- Batch 1: class1-water-dist bank additions (content/class1-networks/questions/distribution-250.json); questionNum 2251 to 2300; itemId DISTRIBUTION-L1-251 to DISTRIBUTION-L1-300.
- Batch 2: class1-water-dist bank additions (content/class1-networks/questions/distribution-250.json); questionNum 2301 to 2350; itemId DISTRIBUTION-L1-301 to DISTRIBUTION-L1-350.
- Batch 3: class1-water-dist bank additions (content/class1-networks/questions/distribution-250.json); questionNum 2351 to 2400; itemId DISTRIBUTION-L1-351 to DISTRIBUTION-L1-400.
- Batch 4: class1-water-dist bank additions (content/class1-networks/questions/distribution-250.json); questionNum 2401 to 2450; itemId DISTRIBUTION-L1-401 to DISTRIBUTION-L1-450.

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
- [General] mains and services
- [General] valves and hydrants
- [General] meters and service connections
- [Processes] chlorine residual maintenance
- [Processes] flushing programs
- [Support Systems] elevated storage
- [Support Systems] pressure and head
- [Administration] sampling in distribution
Calculation topics (10 items spread across these; every result an exact decimal):
- pipe volume
- velocity from flow and area
- pressure from head at 9.81 kPa per m
- flow conversion

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [General] cross-connection control
- [General] backflow prevention
- [Processes] dead ends and water age
- [Processes] leak detection awareness
- [Support Systems] booster pumps
- [Support Systems] standpipes and reservoirs
- [Administration] customer pressure complaints
- [General] main break response
Calculation topics (10 items spread across these; every result an exact decimal):
- storage volume
- turnover time
- chlorine dose mass
- pump run time

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Processes] nitrification awareness
- [Processes] disinfection of repaired mains
- [General] hydrant operation and flow awareness
- [Support Systems] pressure zones awareness
- [Administration] record keeping
- [General] excavation safety awareness
- [Support Systems] tank inspection awareness
- [Processes] flushing volumes
Calculation topics (10 items spread across these; every result an exact decimal):
- flushing volume at three pipe volumes
- hydrant flow awareness calculation
- residual decay awareness calculation
- tank drainage time

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Administration] regulation 170/03 distribution duties
- [General] service line materials awareness
- [Processes] water quality complaint response
- [Support Systems] SCADA awareness
- [General] traffic control awareness
- [Processes] storage mixing awareness
- [Administration] operator duties
- [Support Systems] energy awareness in pumping
Calculation topics (10 items spread across these; every result an exact decimal):
- service flow conversion
- storage detention calculation
- chlorine feed quantity
- pressure zone head difference

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 1 Water Distribution grounding (courseKey class1-water-dist)

Destination bank in the repo: class1-water-dist, authored in
content/class1-networks (250 distribution candidates: 200 conceptual and
50 worked calculations, alongside the Class 1 Collection set). Scope for
this build: distribution system components (mains, valves, hydrants,
service connections, meters), storage (elevated tanks, standpipes,
ground reservoirs, turnover and water age), pressure and hydraulics
(head and pressure, velocity, friction loss awareness, flow measurement),
distribution pumps and booster stations, water quality in the system
(chlorine residual maintenance, flushing programs, dead ends, nitrification
awareness), cross-connection control and backflow prevention, leak
detection, main break response and disinfection awareness for new and
repaired mains, sampling in distribution, customer pressure and flow
complaints at an introductory level, safety (traffic control awareness,
excavation awareness, confined spaces in chambers and tanks), and Ontario
Regulation 170/03 distribution context at an introductory level.
Calculation vocabulary: pipe volume and velocity, flow conversions,
storage volume and turnover time, chlorine dose mass and residual decay
awareness, pressure from head (use 9.81 kPa per metre of head), pump run
times, flushing volumes (three pipe volumes awareness), hydrant flow
awareness. Id prefix for this course: c1wd (c1wd-ladder01..100,
c1wd-process01..100, c1wd-error01..100, c1wd-evidence01..100,
c1wd-mission01..100). Level: "class1". Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA Small
Drinking Water Systems Handbook, US EPA Cross-Connection Control Manual,
EPANET hydraulics background, OWWCO exam preparation resources, WPI
Distribution Class I criteria, Ontario Regulation 170/03, CCOHS safety
guidance.
