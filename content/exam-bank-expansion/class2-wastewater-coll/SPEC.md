# SPEC: class2-wastewater-coll exam-bank expansion (200 new questions)

- courseKey: class2-wastewater-coll
- bankKey (use in every item): class2-wastewater-coll
- Destination bank: class2-wastewater-coll bank (bankKey class2-wastewater-coll)
- Schema variant: net
- Family: ontario; track: wastewater-collection; level: 2

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

- Batch 1: class2-wastewater-coll bank additions; questionNum 2251 to 2300; itemId COLLECTION-L2-251 to COLLECTION-L2-300.
- Batch 2: class2-wastewater-coll bank additions; questionNum 2301 to 2350; itemId COLLECTION-L2-301 to COLLECTION-L2-350.
- Batch 3: class2-wastewater-coll bank additions; questionNum 2351 to 2400; itemId COLLECTION-L2-351 to COLLECTION-L2-400.
- Batch 4: class2-wastewater-coll bank additions; questionNum 2401 to 2450; itemId COLLECTION-L2-401 to COLLECTION-L2-450.

## Modules allowed for this course

Collection System Components, Equipment Operation & Maintenance, Lift Station Operation and Maintenance, Collection System Monitoring & Evaluation, Safety & Regulations

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
- CMOM program development
- condition assessment programs
- CCTV defect interpretation
- manhole assessment
- rehabilitation methods CIPP
- pipe bursting and slip lining
- flow monitoring analysis
- rainfall dependent I&I
Calculation topics (10 items spread across these; every result an exact decimal):
- I&I rate calculation
- RDII volume with given coefficients
- rehabilitation quantity liner length and area
- cleaning completion percentage

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- I&I reduction programs
- lift station reliability analysis
- force main management
- air release programs
- odour and sulfide corrosion management
- FOG programs depth
- private side source programs
- emergency response planning
Calculation topics (10 items spread across these; every result an exact decimal):
- wet well and pump capacity analysis
- slope and velocity with given areas
- surcharge storage volume
- unit rate quantity calculation

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- basin comparison analysis
- step testing for I&I awareness
- lateral rehabilitation awareness
- spot repairs
- grate and cover programs
- asset data management
- regulatory reporting depth
- supervisory awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- infiltration per hectare calculation
- pump cycle analysis
- rehab area quantity
- program completion forecast

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- regulation 129/04 class 2 duties
- safety program depth
- contractor coordination awareness
- public notification programs
- odour complaint response
- corrosion protection awareness
- energy awareness lift stations
- optimization of cleaning programs
Calculation topics (10 items spread across these; every result an exact decimal):
- flow weighted quantities
- detention in force mains
- storage volume in surcharged pipe
- cost style quantity with given rates

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 2 Wastewater Collection grounding (courseKey class2-wastewater-coll)

No dedicated bank folder exists in the repo for Class 2; the closest
matching bank structure is content/class1-networks (the
class1-wastewater-coll bank), deepened to the Class 2 scope in the
OWWCO and WPI Need-to-Know progression. Scope for this build: everything
in Class 1 Collection at greater depth, plus CMOM program development,
condition assessment programs (CCTV defect interpretation, manhole
assessment, condition grading awareness in generic terms),
rehabilitation methods awareness (cured in place lining, pipe bursting,
slip lining, spot repairs, lateral rehabilitation awareness), flow
monitoring program analysis (basin comparisons, rainfall dependent
infiltration and inflow with given values), infiltration and inflow
reduction programs, lift station reliability and capacity analysis,
force main management and air release programs, odour and sulfide
corrosion management with given generation factors, fats oils and grease
programs at greater depth, private side sources awareness, emergency
response planning, and Ontario Regulation 129/04 at the Class 2 level.
Calculation vocabulary: infiltration and inflow rates and rainfall
dependent inflow volumes with given coefficients, rehabilitation
quantities (liner lengths and areas with given dimensions), cleaning
and CCTV program production and completion percentages, wet well and
pump capacity analysis, slope and velocity with given areas, surcharge
and storage volume style calculations with given values, cost style
unit rate calculations with given rates (quantities only, no pricing
advice). Id prefix for this course: c2wc (c2wc-ladder01..100,
c2wc-process01..100, c2wc-error01..100, c2wc-evidence01..100,
c2wc-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class2 level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA CMOM
Guide for collection systems, US EPA Alternative Wastewater Collection
Systems Manual, OWWCO exam preparation resources, WPI Collection
Class II criteria, Ontario Regulation 129/04, CCOHS safety guidance.
