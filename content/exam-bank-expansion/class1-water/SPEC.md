# SPEC: class1-water exam-bank expansion (200 new questions)

- courseKey: class1-water
- bankKey (use in every item): class1-water
- Destination bank: content/class1-treatment/questions/water-250.json
- Schema variant: treat
- Family: ontario; track: water-treatment; level: 1

## Schema variant rules

Field set (EXACTLY these fields, no more, no fewer):
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
- tip: "Check dimensional consistency and round only the final result." or a similar short study tip.

## Example conceptual item (from the existing bank; copy its shape exactly)

```json
{
 "topic": "Source assessment",
 "question": "A reservoir intake has ports at several depths. What evidence best supports selecting a port after summer stratification develops?",
 "correctAnswer": "Temperature and quality profiles at each depth",
 "explanation": "Depth profiles reveal changes such as low oxygen, algae or dissolved metals; depth alone does not identify the best water.",
 "isCalc": "no",
 "bankKey": "class1-water",
 "questionNum": 2001,
 "itemId": "WATER-TREATMENT-L1-001",
 "module": "Water Treatment",
 "options": [
  "The shallowest port's distance from shore",
  "The previous winter's average raw-water pH",
  "The deepest port's pipe diameter alone",
  "Temperature and quality profiles at each depth"
 ],
 "correctIndex": 3,
 "reviewStatus": "unreviewed",
 "difficulty": "medium",
 "cognitiveLevel": "application",
 "sourceTitle": "US EPA: Surface Water Treatment Rules — supporting treatment resources",
 "sourceUrl": "https://www.epa.gov/dwreginfo/surface-water-treatment-rules",
 "sourceReference": "Supporting resource category: Source assessment. See SOURCES.md: these are not claim-level verification citations.",
 "blueprintObjective": "Source assessment",
 "evidenceStatus": "original-candidate-topic-reference-not-independent-SME-certification",
 "optionA": "The shallowest port's distance from shore",
 "optionB": "The previous winter's average raw-water pH",
 "optionC": "The deepest port's pipe diameter alone",
 "optionD": "Temperature and quality profiles at each depth"
}
```

## Example calculation item (from the existing bank)

```json
{
 "topic": "Flow conversion",
 "question": "A raw-water pump delivers 18 L/s continuously. What daily volume does it deliver? Round to one decimal place.",
 "correctAnswer": "1555.2 m3/day",
 "isCalc": "yes",
 "formula": "Daily m3 = L/s × 86.4",
 "expression": "18*86.4",
 "expected": "1555.2",
 "decimalPlaces": 1,
 "unit": "m3/day",
 "explanation": "Daily m3 = L/s × 86.4. Substitution: 18 × 86.4 = 1555.2 m3/day. Use the supplied units and assumptions, and round only the final result. This calculation does not establish a field operating limit.",
 "steps": "[{\"l\": \"Relationship\", \"c\": \"Daily m3 = L/s \\u00d7 86.4\"}, {\"l\": \"Substitution\", \"c\": \"18 \\u00d7 86.4\"}, {\"l\": \"Result\", \"c\": \"1555.2 m3/day\"}]",
 "tip": "Check dimensional consistency and round only the final result.",
 "bankKey": "class1-water",
 "questionNum": 2201,
 "itemId": "WATER-TREATMENT-L1-201",
 "module": "Water Treatment",
 "options": [
  "1866.2 m3/day",
  "1555.2 m3/day",
  "3110.4 m3/day",
  "155.5 m3/day"
 ],
 "correctIndex": 1,
 "reviewStatus": "unreviewed",
 "difficulty": "medium",
 "cognitiveLevel": "application",
 "sourceTitle": "WPI: formula/conversion tables",
 "sourceUrl": "https://gowpi.org/services/abc-testing/formula-conversion-tables/",
 "sourceReference": "Supporting resource category: Flow conversion. See SOURCES.md: these are not claim-level verification citations.",
 "blueprintObjective": "Flow conversion",
 "evidenceStatus": "original-candidate-topic-reference-not-independent-SME-certification",
 "optionA": "1866.2 m3/day",
 "optionB": "1555.2 m3/day",
 "optionC": "3110.4 m3/day",
 "optionD": "155.5 m3/day"
}
```

## Numbering

- Batch 1: class1-water bank additions (content/class1-treatment/questions/water-250.json); questionNum 2251 to 2300; itemId WATER-TREATMENT-L1-251 to WATER-TREATMENT-L1-300.
- Batch 2: class1-water bank additions (content/class1-treatment/questions/water-250.json); questionNum 2301 to 2350; itemId WATER-TREATMENT-L1-301 to WATER-TREATMENT-L1-350.
- Batch 3: class1-water bank additions (content/class1-treatment/questions/water-250.json); questionNum 2351 to 2400; itemId WATER-TREATMENT-L1-351 to WATER-TREATMENT-L1-400.
- Batch 4: class1-water bank additions (content/class1-treatment/questions/water-250.json); questionNum 2401 to 2450; itemId WATER-TREATMENT-L1-401 to WATER-TREATMENT-L1-450.

## Modules allowed for this course

Water Treatment

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA - Small Drinking Water Systems Handbook | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT
- US EPA: Surface Water Treatment Rules — supporting treatment resources | https://www.epa.gov/dwreginfo/surface-water-treatment-rules
- US EPA - Surface Water Treatment Rule Turbidity Guidance Manual | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100ZLYM.TXT
- Ontario Regulation 170/03 - Drinking Water Systems | https://www.ontario.ca/laws/regulation/030170
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html
- WPI: formula/conversion tables | https://gowpi.org/services/abc-testing/formula-conversion-tables/

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- source-water assessment
- coagulation basics
- flocculation basics
- sedimentation basics
- rapid filtration
- chlorine disinfection
- storage and clear wells
- basic water chemistry
Calculation topics (10 items spread across these; every result an exact decimal):
- detention time
- filter loading rate
- chlorine dose and demand
- flow conversion

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- intakes and screens
- jar testing awareness
- settled water quality
- filter media and underdrains
- CT concept
- pumps and pumping basics
- sampling points and methods
- turbidity and particle removal
Calculation topics (10 items spread across these; every result an exact decimal):
- surface overflow rate
- pipe volume
- chemical feed mass
- head and pressure conversion

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- coagulant types and aids
- mixing and floc growth
- sludge blanket in clarifiers
- filter runs and backwash triggers
- chlorine residual management
- corrosion basics
- laboratory tests pH and alkalinity
- safety chemical handling
Calculation topics (10 items spread across these; every result an exact decimal):
- backwash volume
- tank volume and turnover
- percent removal
- velocity in pipes

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- source protection awareness
- disinfection by-products awareness
- filter troubleshooting
- taste and odour basics
- iron and manganese awareness
- softening awareness
- record keeping and reporting
- operator duties and licensing
Calculation topics (10 items spread across these; every result an exact decimal):
- solution strength and feed rate
- storage detention time
- pump run time
- chlorine demand calculation

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 1 Water grounding

Bank structure sampled from content/class1-water/questions (batch files,
40 questions each). Modules seen: Filtration, Disinfection, Coagulation and
Flocculation, Sedimentation, Hydraulics, Chemical Feed and Dosing, Water
Distribution, Water Quality and Regulations, Water Sources and Quality,
Pumps and Hydraulics, Safety, Sampling and Laboratory, Instrumentation and
Control, Iron and Manganese Removal, Softening. Topics seen: corrosion
control, flocculation control, detention time, chemical dosage, filter run
termination, surface overflow rate, filter maintenance problems, CT
calculation, contact time and baffling, solution strength, residual
maintenance, jar testing, backwash volume, breakpoint chlorination,
post-precipitation, chlorine demand, disinfection by-products, sludge
management, taste and odour, air binding.

Pilot topics: coagulation-flocculation, filtration headloss and loading,
hydraulics detention time (single and parallel cells), conventional train,
particle removal, pretreatment flocculation, settled water, sedimentation
troubleshooting, solids mass rate, water chemistry and colour. Extend across
the Class 1 water treatment scope: sources and intake, coagulation,
flocculation, sedimentation, filtration, disinfection and CT, storage,
pumps, basic chemistry (pH, alkalinity, hardness), sampling and lab basics,
safety, Ontario drinking water regulations at an introductory level.
