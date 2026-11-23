# SPEC: class1-wastewater-coll exam-bank expansion (200 new questions)

- courseKey: class1-wastewater-coll
- bankKey (use in every item): class1-wastewater-coll
- Destination bank: content/class1-networks/questions/collection-250.json
- Schema variant: net
- Family: ontario; track: wastewater-collection; level: 1

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

- Batch 1: class1-wastewater-coll bank additions (content/class1-networks/questions/collection-250.json); questionNum 2251 to 2300; itemId COLLECTION-L1-251 to COLLECTION-L1-300.
- Batch 2: class1-wastewater-coll bank additions (content/class1-networks/questions/collection-250.json); questionNum 2301 to 2350; itemId COLLECTION-L1-301 to COLLECTION-L1-350.
- Batch 3: class1-wastewater-coll bank additions (content/class1-networks/questions/collection-250.json); questionNum 2351 to 2400; itemId COLLECTION-L1-351 to COLLECTION-L1-400.
- Batch 4: class1-wastewater-coll bank additions (content/class1-networks/questions/collection-250.json); questionNum 2401 to 2450; itemId COLLECTION-L1-401 to COLLECTION-L1-450.

## Modules allowed for this course

Monitor, Evaluate & Adjust Collection System, Maintain & Restore Collection System, Operate Equipment, Evaluate & Maintain Equipment, Maintain Lift Stations, Security, Safety & Administrative Procedures

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA — CMOM Guide for Sanitary Sewer Collection Systems | https://www.epa.gov/sites/default/files/2015-10/documents/cmom_guide_for_collection_systems.pdf
- US EPA - Alternative Wastewater Collection Systems Manual | https://nepis.epa.gov/Exe/ZyNET.exe?Index=Prior+to+1976&Query=&SearchMethod=1&FuzzyDegree=0&User=ANONYMOUS&Password=<redacted>&QField=pubnumber%5E%22625191024%22&UseQField=pubnumber&IntQFieldOp=1&ExtQFieldOp=0&Docs=
- Ontario Regulation 129/04 - Licensing of Sewage Works Operators | https://www.ontario.ca/laws/regulation/040129
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html
- Canadian Centre for Occupational Health and Safety - Hydrogen Sulfide | https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html
- WPI: 2025 Need-to-Know criteria | https://gowpi.org/services/2025-need-to-know-criteria/

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- gravity sewers and manholes
- lift station components
- wet wells and level control
- force mains
- flow monitoring basics
- infiltration and inflow sources
- sewer cleaning methods
- safety confined space preparation
Calculation topics (10 items spread across these; every result an exact decimal):
- flow conversion
- sewer slope from inverts
- pipe volume
- wet well fill time

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- CCTV inspection awareness
- blockage causes roots and FOG
- odour and hydrogen sulfide awareness
- spill and overflow response awareness
- CMOM principles
- jetting and flushing awareness
- manhole inspection basics
- traffic control awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- pipe velocity from continuity
- pump run time and cycles
- force main velocity
- infiltration rate per length

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- lift station alarms and response
- pump types for wastewater
- gas testing before entry
- night flow analysis awareness
- cleaning production awareness
- defect vocabulary basics
- reporting duties
- regulation 129/04 awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- wet well drawdown time
- force main detention time
- percent of capacity with given full flow
- cleaning length and production rate

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- collection system mapping awareness
- private side sources awareness
- emergency response basics
- equipment care and checks
- safety lockout
- record keeping
- operator duties
- public interaction awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- flow and volume conversions
- slope and velocity combined
- pump capacity check
- inflow volume with given rates

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 1 Wastewater Collection grounding (courseKey class1-wastewater-coll)

Destination bank in the repo: class1-wastewater-coll, authored in
content/class1-networks (250 collection candidates: 200 conceptual and
50 worked calculations, alongside the Class 1 Distribution set). Scope
for this build: gravity sewers and manholes, lift stations and wet
wells, force mains, flow monitoring and metering, infiltration and
inflow (sources, measurement, night flow analysis), sewer cleaning
(flushing, rodding, jetting awareness, bucket machines), CCTV inspection
awareness and defect vocabulary at an introductory level, blockages
(roots, fats oils and grease, debris, structural defects), odour and
hydrogen sulfide and corrosion awareness, sewer safety (confined space
entry preparation, gas testing, traffic control), CMOM style management,
operation and maintenance principles, spill and overflow response
awareness and reporting, and Ontario licensing context under Regulation
129/04 at an introductory level. Calculation vocabulary: flow
conversions, sewer slope from invert elevations, pipe volume and
velocity from continuity, wet well fill and drawdown times, pump run
time and cycles, force main velocity and detention, infiltration rates
per length and per hectare style calculations, percent of capacity
awareness with given full flow values. Id prefix for this course: c1wc
(c1wc-ladder01..100, c1wc-process01..100, c1wc-error01..100,
c1wc-evidence01..100, c1wc-mission01..100). Level: "class1". Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA CMOM Guide for collection systems, US EPA Alternative
Wastewater Collection Systems Manual, OWWCO exam preparation resources,
WPI Collection Class I criteria, Ontario Regulation 129/04, CCOHS
safety guidance.
