# SPEC: class4-water exam-bank expansion (200 new questions)

- courseKey: class4-water
- bankKey (use in every item): class4-water
- Destination bank: class4-water bank (bankKey class4-water)
- Schema variant: treat
- Family: ontario; track: water-treatment; level: 4

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

- Batch 1: class4-water bank additions; questionNum 2251 to 2300; itemId WATER-TREATMENT-L4-251 to WATER-TREATMENT-L4-300.
- Batch 2: class4-water bank additions; questionNum 2301 to 2350; itemId WATER-TREATMENT-L4-301 to WATER-TREATMENT-L4-350.
- Batch 3: class4-water bank additions; questionNum 2351 to 2400; itemId WATER-TREATMENT-L4-351 to WATER-TREATMENT-L4-400.
- Batch 4: class4-water bank additions; questionNum 2401 to 2450; itemId WATER-TREATMENT-L4-401 to WATER-TREATMENT-L4-450.

## Modules allowed for this course

Treatment Process, Laboratory Analysis, Equipment O&M, Source Water, Safety & Admin

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
- utility management and governance
- advanced treatment evaluation
- membrane fleet management
- UV system management at scale
- disinfection strategy leadership
- residuals strategy
- energy strategy
- DWQMS leadership and management review
Calculation topics (10 items spread across these; every result an exact decimal):
- whole plant mass balance with given values
- membrane replacement quantity with given rates
- UV bank capacity with given factors
- energy benchmarking per volume

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- risk management at utility scale
- emergency leadership
- capital planning and asset strategy
- regulatory leadership
- inspection readiness leadership
- advanced laboratory quality systems
- chemical program management
- system wide optimization
Calculation topics (10 items spread across these; every result an exact decimal):
- chemical program quantity with given unit rates
- residuals production forecast with given yields
- storage planning with peaking factors
- compliance sampling program counts

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- treatment technology selection studies
- pilot program leadership
- water quality strategy
- source protection at utility scale
- workforce and certification planning
- financial planning awareness quantities
- stakeholder communication leadership
- performance benchmarking
Calculation topics (10 items spread across these; every result an exact decimal):
- capacity planning quantity with given growth factors
- energy per volume comparison
- membrane capacity balance
- program quantity with given rates

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- long term master planning awareness
- climate resilience awareness
- regulatory change management
- audit and management review
- succession and training leadership
- intermunicipal agreements awareness
- data driven decision making
- continuous improvement leadership
Calculation topics (10 items spread across these; every result an exact decimal):
- whole utility water balance quantity
- chemical storage planning quantity
- residuals haulage quantity with given yields
- sampling program design counts

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 4 Water Treatment grounding (courseKey class4-water)

The repo holds no Class 4 bank folder, so the closest matching bank
structure is content/class1-water, deepened through the Class 2 and
Class 3 builds to the Class 4 scope in the OWWCO and WPI Need-to-Know
progression. Class 4 is the senior Ontario level: scope is plant and
utility management, advanced treatment process evaluation and design
review awareness, system wide optimization, membrane and ultraviolet
system management at utility scale, disinfection strategy leadership,
residuals and energy strategy, Drinking Water Quality Management
Standard leadership and management review, risk management and
emergency leadership at utility scale, capital planning and asset
strategy awareness, regulatory leadership and inspection readiness,
advanced laboratory and quality system management, and Ontario
Regulation 170/03 at the Class 4 level. Calculation vocabulary:
whole plant mass and energy balances with given values, membrane fleet
capacity, recovery and replacement quantity calculations with given
rates, ultraviolet bank capacity and dose pacing with given factors,
chemical program cost style quantities with given unit rates
(quantities only, no pricing advice), residuals production forecasts
with given yields, energy benchmarking per volume with given values,
storage and capacity planning quantities with given peaking factors,
compliance sampling program counts. Use given values and factors so
every result is an exact decimal; no exponential or logarithmic
numerics. Id prefix for this course: c4w (c4w-ladder01..100,
c4w-process01..100, c4w-error01..100, c4w-evidence01..100,
c4w-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class4 level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA
membrane and UV guidance background, US EPA Surface Water Treatment
Rule guidance, OWWCO exam preparation resources, WPI 2025 Need-to-Know
criteria for Water Treatment Class IV, Ontario Regulation 170/03,
Ontario Drinking Water Quality Management Standard, CCOHS safety
guidance.
