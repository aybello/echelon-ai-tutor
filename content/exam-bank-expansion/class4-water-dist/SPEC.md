# SPEC: class4-water-dist exam-bank expansion (200 new questions)

- courseKey: class4-water-dist
- bankKey (use in every item): class4-water-dist
- Destination bank: class4-water-dist bank (bankKey class4-water-dist)
- Schema variant: net
- Family: ontario; track: water-distribution; level: 4

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

- Batch 1: class4-water-dist bank additions; questionNum 2251 to 2300; itemId DISTRIBUTION-L4-251 to DISTRIBUTION-L4-300.
- Batch 2: class4-water-dist bank additions; questionNum 2301 to 2350; itemId DISTRIBUTION-L4-301 to DISTRIBUTION-L4-350.
- Batch 3: class4-water-dist bank additions; questionNum 2351 to 2400; itemId DISTRIBUTION-L4-351 to DISTRIBUTION-L4-400.
- Batch 4: class4-water-dist bank additions; questionNum 2401 to 2450; itemId DISTRIBUTION-L4-401 to DISTRIBUTION-L4-450.

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
- [Administration] distribution utility management
- [Processes] system wide water quality strategy
- [General] water loss strategy and audit leadership
- [Support Systems] pressure and storage strategy
- [Administration] asset management strategy
- [Processes] DWQMS leadership for distribution
- [General] risk management at utility scale
- [Administration] regulatory leadership
Calculation topics (10 items spread across these; every result an exact decimal):
- system water balance quantity with given volumes
- zone demand forecast with given factors
- storage sizing quantity
- pump fleet energy benchmarking

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Support Systems] energy strategy for pumping
- [Administration] capital planning leadership
- [Processes] booster disinfection programs
- [General] emergency leadership
- [Administration] inspection readiness leadership
- [Processes] flushing and turnover programs
- [Support Systems] storage fleet management
- [Administration] ORO leadership
Calculation topics (10 items spread across these; every result an exact decimal):
- booster program quantity with given factors
- flushing program volume
- sampling program design counts
- renewal quantity with given unit rates

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [General] asset renewal strategy
- [Processes] water quality risk assessment
- [Administration] workforce planning
- [Support Systems] data and metering strategy
- [Processes] pressure management strategy
- [General] intermunicipal supply awareness
- [Administration] financial planning awareness
- [Processes] performance benchmarking
Calculation topics (10 items spread across these; every result an exact decimal):
- loss component forecast quantity
- storage turnover strategy quantity
- energy per volume comparison
- program quantity with given rates

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Administration] long term master planning
- [Processes] climate resilience for distribution
- [General] regulatory change management
- [Administration] management review
- [Support Systems] technology evaluation
- [Processes] customer service strategy
- [General] succession leadership
- [Administration] continuous improvement leadership
Calculation topics (10 items spread across these; every result an exact decimal):
- whole system balance quantity
- demand planning quantity
- renewal program forecast
- sampling program counts at utility scale

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 4 Water Distribution grounding (courseKey class4-water-dist)

The repo holds a partial Class 3 distribution structure but no Class 4
bank, so the closest complete matching bank structure is
content/class1-networks (the bank used for class1-water-dist),
deepened through the Class 2 and Class 3 builds to the Class 4 scope
in the OWWCO and WPI Need-to-Know progression. Class 4 is the senior
Ontario level: scope is distribution utility management, system wide
water quality strategy, water loss strategy and audit leadership with
given values, pressure and storage strategy at system scale, asset
management strategy and capital planning leadership, Drinking Water
Quality Management Standard leadership for distribution operations,
risk management and emergency leadership at utility scale, regulatory
leadership and inspection readiness, energy strategy for pumping,
supervisory and overall responsible operator leadership, and Ontario
Regulation 170/03 at the Class 4 level. Calculation vocabulary: system
water balance and loss component quantities with given volumes, zone
demand forecasting with given growth and peaking factors, storage
sizing and turnover strategy quantities with given values, pump fleet
energy benchmarking with given values, booster disinfection program
quantities with given factors, flushing and turnover program volumes,
sampling program design counts, renewal program quantities with given
unit rates (quantities only, no pricing advice). Use given values and
factors so every result is an exact decimal; no exponential or
logarithmic numerics and no Hazen-Williams. Id prefix for this course:
c4wd (c4wd-ladder01..100, c4wd-process01..100, c4wd-error01..100,
c4wd-evidence01..100, c4wd-mission01..100). Level: "class1" (placeholder
per FORMAT.md section 5; the contract has no class4 level value yet,
and this mapping is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA Small Drinking Water Systems Handbook, US EPA
Cross-Connection Control Manual, US EPA EPANET and manual, OWWCO exam
preparation resources, WPI Water Distribution Class IV Need-to-Know
Criteria, Ontario Regulation 170/03, CCOHS safety guidance.
