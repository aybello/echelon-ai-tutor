# SPEC: wpi-class2-water-dist exam-bank expansion (200 new questions)

- courseKey: wpi-class2-water-dist
- bankKey (use in every item): wpi-class2-water-dist
- Destination bank: wpi-class2-water-dist bank (bankKey wpi-class2-water-dist)
- Schema variant: net
- Family: western; track: water-distribution; level: 2

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

- Batch 1: wpi-class2-water-dist bank additions; questionNum 2251 to 2300; itemId DISTRIBUTION-L2-251 to DISTRIBUTION-L2-300.
- Batch 2: wpi-class2-water-dist bank additions; questionNum 2301 to 2350; itemId DISTRIBUTION-L2-301 to DISTRIBUTION-L2-350.
- Batch 3: wpi-class2-water-dist bank additions; questionNum 2351 to 2400; itemId DISTRIBUTION-L2-351 to DISTRIBUTION-L2-400.
- Batch 4: wpi-class2-water-dist bank additions; questionNum 2401 to 2450; itemId DISTRIBUTION-L2-401 to DISTRIBUTION-L2-450.

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
- [General] hydraulic grade interpretation
- [Processes] pressure management and PRVs
- [Processes] district metered areas
- [Support Systems] pump curves and system curves
- [Support Systems] storage turnover management
- [Processes] nitrification monitoring and response
- [Administration] valve and hydrant programs
- [General] large meter testing awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- affinity law flow and head
- head loss from given unit rates
- night flow leakage volume
- storage turnover calculation

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Processes] flushing program design
- [General] break record analysis
- [Support Systems] mixing in storage
- [Processes] residual management programs
- [Administration] cross-connection program administration
- [General] asset condition awareness
- [Support Systems] energy in pumping
- [Processes] pressure zone management
Calculation topics (10 items spread across these; every result an exact decimal):
- flushing design volume and velocity
- pump energy with given efficiency
- chlorine decay with given rates
- pressure zone head difference

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [General] meter accuracy awareness
- [Processes] leakage step testing
- [Support Systems] elevated tank operations depth
- [Administration] sampling program administration
- [Processes] water age management
- [General] hydrant flow testing
- [Support Systems] booster station operations
- [Administration] emergency response awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- leakage volume from night flow
- tank volume and turnover
- dose mass with strength correction
- flow conversion at system scale

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Processes] disinfection of new mains
- [General] corrosion in distribution awareness
- [Support Systems] pressure transient awareness
- [Administration] regulation 170/03 class 2 duties
- [Processes] complaint investigation depth
- [General] service connection programs
- [Support Systems] reservoir operations
- [Administration] supervisory awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- zone demand with given peaking factors
- storage water age calculation
- booster dose quantity
- pump run time at system scale

## Grounding (from the game build AUTHORING-BRIEF; binding)

## WPI Class 2 Water Distribution grounding (courseKey wpi-class2-water-dist)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class II, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 1 build to the
Class II scope: pressure zone management, water loss and non-revenue
water basics (district night flow analysis with given values),
water quality management programs (residual optimization, flushing
program design, storage turnover management), main break and leak
program analysis, pump station operations, cross connection control
program awareness, and operator supervisory awareness at the Class
II level, including cold climate operation. Regulation framing stays
generic: provincial drinking water requirements in general terms and
the Guidelines for Canadian Drinking Water Quality as the federal
reference. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary uses given
values and factors (pressure from head at 9.81 kPa per metre, head
loss only with a given loss rate per length) so every result is an
exact decimal; no Hazen-Williams formula and no exponential or
logarithmic numerics. Id prefix for this course: wp2wd
(wp2wd-ladder01..100, wp2wd-process01..100, wp2wd-error01..100,
wp2wd-evidence01..100, wp2wd-mission01..100). Level: "class1"
(placeholder per FORMAT.md section 5; the contract has no class2
level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), WPI 2025 Need-to-Know Criteria
for Water Distribution Class II, Health Canada Guidelines for
Canadian Drinking Water Quality, AWWA water loss control guidance
(background), US EPA distribution system guidance (background),
CCOHS safety guidance.
