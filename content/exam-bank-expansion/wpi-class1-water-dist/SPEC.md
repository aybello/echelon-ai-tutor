# SPEC: wpi-class1-water-dist exam-bank expansion (200 new questions)

- courseKey: wpi-class1-water-dist
- bankKey (use in every item): wpi-class1-water-dist
- Destination bank: wpi-class1-water-dist bank (bankKey wpi-class1-water-dist)
- Schema variant: net
- Family: western; track: water-distribution; level: 1

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

- Batch 1: wpi-class1-water-dist bank additions; questionNum 2251 to 2300; itemId DISTRIBUTION-L1-251 to DISTRIBUTION-L1-300.
- Batch 2: wpi-class1-water-dist bank additions; questionNum 2301 to 2350; itemId DISTRIBUTION-L1-301 to DISTRIBUTION-L1-350.
- Batch 3: wpi-class1-water-dist bank additions; questionNum 2351 to 2400; itemId DISTRIBUTION-L1-351 to DISTRIBUTION-L1-400.
- Batch 4: wpi-class1-water-dist bank additions; questionNum 2401 to 2450; itemId DISTRIBUTION-L1-401 to DISTRIBUTION-L1-450.

## Modules allowed for this course

General, Processes, Support Systems, Administration

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA — EPANET hydraulic modelling | https://www.epa.gov/water-research/epanet
- US EPA — Cross-Connection Control Manual | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=2000262T.TXT
- WPI: 2025 Need-to-Know criteria | https://gowpi.org/services/2025-need-to-know-criteria/
- WPI: formula/conversion tables | https://gowpi.org/services/abc-testing/formula-conversion-tables/
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html

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

## WPI Class 1 Water Distribution grounding (courseKey wpi-class1-water-dist)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class I, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, transposed out of the Ontario framing:
distribution system components (mains, valves, hydrants, services,
meters), storage tanks and reservoirs, booster pumps and pressure
zones, water quality in distribution (residual maintenance, flushing,
sampling), leak awareness, basic hydraulics with given values
(pressure from head at 9.81 kPa per metre, velocities, volumes),
safety, and Class I operator duties, including cold climate
operation (deep frost, frozen services). Regulation framing stays
generic: provincial drinking water requirements in general terms and
the Guidelines for Canadian Drinking Water Quality as the federal
reference. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary uses given
values and factors so every result is an exact decimal; no
Hazen-Williams (head loss only with a given loss rate per length)
and no exponential or logarithmic numerics. Id prefix for this
course: wp1wd (wp1wd-ladder01..100, wp1wd-process01..100,
wp1wd-error01..100, wp1wd-evidence01..100, wp1wd-mission01..100).
Level: "class1" (the natural enum value for a Class I course; the
courseKey allowlist extension remains the outstanding contract item,
recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Water Distribution Class I, Health Canada
Guidelines for Canadian Drinking Water Quality, AWWA distribution
system guidance (background), US EPA distribution system guidance
(background), CCOHS safety guidance.
