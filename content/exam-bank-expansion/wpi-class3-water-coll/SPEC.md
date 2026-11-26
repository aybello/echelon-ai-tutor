# SPEC: wpi-class3-water-coll exam-bank expansion (200 new questions)

- courseKey: wpi-class3-water-coll
- bankKey (use in every item): wpi-class3-water-coll
- Destination bank: wpi-class3-water-coll bank (bankKey wpi-class3-water-coll)
- Schema variant: net
- Family: western; track: wastewater-collection; level: 3

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

- Batch 1: wpi-class3-water-coll bank additions; questionNum 2251 to 2300; itemId COLLECTION-L3-251 to COLLECTION-L3-300.
- Batch 2: wpi-class3-water-coll bank additions; questionNum 2301 to 2350; itemId COLLECTION-L3-301 to COLLECTION-L3-350.
- Batch 3: wpi-class3-water-coll bank additions; questionNum 2351 to 2400; itemId COLLECTION-L3-351 to COLLECTION-L3-400.
- Batch 4: wpi-class3-water-coll bank additions; questionNum 2401 to 2450; itemId COLLECTION-L3-401 to COLLECTION-L3-450.

## Modules allowed for this course

Collection System Components, Equipment Operation & Maintenance, Lift Station Operation and Maintenance, Collection System Monitoring & Evaluation, Safety & Regulations

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA — CMOM Guide for Sanitary Sewer Collection Systems | https://www.epa.gov/sites/default/files/2015-10/documents/cmom_guide_for_collection_systems.pdf
- US EPA - Alternative Wastewater Collection Systems Manual | https://nepis.epa.gov/Exe/ZyNET.exe?Index=Prior+to+1976&Query=&SearchMethod=1&FuzzyDegree=0&User=ANONYMOUS&Password=<redacted>&QField=pubnumber%5E%22625191024%22&UseQField=pubnumber&IntQFieldOp=1&ExtQFieldOp=0&Docs=
- WPI: 2025 Need-to-Know criteria | https://gowpi.org/services/2025-need-to-know-criteria/
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html
- Canadian Centre for Occupational Health and Safety - Hydrogen Sulfide | https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- collection system management at scale
- CMOM leadership
- I&I reduction program design
- RDII analysis depth
- lift station system management
- force main reliability programs
- odour and corrosion programs
- FOG program leadership
Calculation topics (10 items spread across these; every result an exact decimal):
- I&I rate at system scale
- RDII volume with given coefficients
- peaking factor and design flow
- wet well cycling analysis

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- sewer rehabilitation program planning
- prioritization methods awareness
- overflow and bypass response leadership
- reporting leadership
- asset management awareness
- capital planning awareness
- ORO duties awareness
- emergency leadership
Calculation topics (10 items spread across these; every result an exact decimal):
- rehabilitation quantities liner and grout
- cleaning and CCTV completion percentages
- surcharge storage volume
- odour chemical dosing with given rates

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- capacity analysis at system scale
- flow monitoring program leadership
- condition grading programs
- data driven decisions
- regulatory inspections readiness
- safety leadership
- team supervision
- technology evaluation awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- capacity planning with given factors
- force main velocity and detention
- program production rates
- unit rate quantities

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- long term I&I strategy
- climate resilience awareness
- regulatory change management
- management review
- succession leadership
- continuous improvement
- stakeholder communication
- performance benchmarking
Calculation topics (10 items spread across these; every result an exact decimal):
- system flow accounting quantity
- rehab program forecast quantity
- storage quantity with given values
- sampling and monitoring counts

## Grounding (from the game build AUTHORING-BRIEF; binding)

## WPI Class 3 Wastewater Collection grounding (courseKey wpi-class3-water-coll)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Collection Class III, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 2 collection
build: inflow and infiltration programs and rehabilitation programs
(basin studies, source removal economics, lining and renewal
programs), CMOM program elements (capacity assurance, overflow
response plans, performance tracking), asset management awareness
for collection networks, lift station optimization and reliability
programs, condition assessment programs, capacity and growth
planning awareness, safety program leadership, senior operator
decision making, and cold climate operations at scale. Regulation
framing stays generic: provincial wastewater requirements in
general terms, the federal Wastewater Systems Effluent Regulations
and the CCME Canada-wide Strategy as general federal references.
Do NOT cite Ontario regulations, and do NOT invent provincial
regulation numbers. Calculation vocabulary uses given values and
factors (flows, volumes, velocities from given areas, pump rates,
rainfall volumes over given areas, program costs with given unit
rates) so every result is an exact decimal; no Hazen-Williams
formula and no exponential or logarithmic numerics. Id prefix for
this course: wp3wc (wp3wc-ladder01..100, wp3wc-process01..100,
wp3wc-error01..100, wp3wc-evidence01..100, wp3wc-mission01..100).
Level: "class1" (placeholder per FORMAT.md section 5; the contract
has no class3 level value yet, and this mapping is recorded in the
course BUILD-NOTES). Sources: Spellman Handbook of Water and
Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Wastewater Collection Class III, CCME
Canada-wide Strategy for the Management of Municipal Wastewater
Effluent, Government of Canada Wastewater Systems Effluent
Regulations, US EPA collection system guidance (background),
CCOHS safety guidance.
