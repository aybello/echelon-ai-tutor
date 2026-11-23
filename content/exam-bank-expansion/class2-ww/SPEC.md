# SPEC: class2-ww exam-bank expansion (200 new questions)

- courseKey: class2-ww
- bankKey (use in every item): class2-wastewater
- Destination bank: class2-wastewater bank (bankKey class2-wastewater)
- Schema variant: treat
- Family: ontario; track: wastewater-treatment; level: 2

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

- Batch 1: class2-wastewater bank additions; questionNum 2251 to 2300; itemId WASTEWATER-TREATMENT-L2-251 to WASTEWATER-TREATMENT-L2-300.
- Batch 2: class2-wastewater bank additions; questionNum 2301 to 2350; itemId WASTEWATER-TREATMENT-L2-301 to WASTEWATER-TREATMENT-L2-350.
- Batch 3: class2-wastewater bank additions; questionNum 2351 to 2400; itemId WASTEWATER-TREATMENT-L2-351 to WASTEWATER-TREATMENT-L2-400.
- Batch 4: class2-wastewater bank additions; questionNum 2401 to 2450; itemId WASTEWATER-TREATMENT-L2-401 to WASTEWATER-TREATMENT-L2-450.

## Modules allowed for this course

Treatment Process Evaluation & Adjustment, Equipment Evaluation, Maintenance & Operation, Safety & Admin, Laboratory Analysis

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA: Municipal Wastewater — supporting treatment resources | https://www.epa.gov/npdes/municipal-wastewater
- US EPA - Resources for Wastewater Operators | https://www.epa.gov/compliance/resources-wastewater-operators
- US EPA - Start-Up of Municipal Wastewater Treatment Facilities | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=00000IDV.TXT
- Ontario Regulation 129/04 - Licensing of Sewage Works Operators | https://www.ontario.ca/laws/regulation/040129
- Canadian Centre for Occupational Health and Safety - Hydrogen Sulfide | https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html
- WPI: formula/conversion tables | https://gowpi.org/services/abc-testing/formula-conversion-tables/

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- activated sludge process control
- solids retention time management
- F/M control
- wasting strategy
- nitrification fundamentals
- denitrification fundamentals
- alkalinity for nitrification
- dissolved oxygen control
Calculation topics (10 items spread across these; every result an exact decimal):
- SRT calculation
- F/M calculation
- alkalinity requirement at 7.14 ratio
- oxygen requirement with given factors

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- aeration systems
- clarifier performance analysis
- effluent disinfection depth
- digester loading
- volatile solids reduction
- gas production awareness
- laboratory BOD quality
- microscopic examination awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- clarifier solids loading
- digester volatile solids loading
- percent volatile solids reduction
- WAS rate from mass balance

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- nutrient testing awareness
- phosphorus awareness
- process trending and instrumentation
- pumps and hydraulics depth
- sludge age management
- bulking and foaming troubleshooting
- rising sludge troubleshooting
- safety depth
Calculation topics (10 items spread across these; every result an exact decimal):
- RAS rate from given values
- aeration detention and air supply awareness
- chemical feed for phosphorus with given factors
- percent removal across stages

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- regulation 129/04 class 2 duties
- supervisory awareness
- effluent compliance awareness
- solids processing optimization
- energy awareness in aeration
- odour control basics
- emergency response
- optimization trials
Calculation topics (10 items spread across these; every result an exact decimal):
- solids inventory calculation
- detention and loading combined
- feed mass with purity correction
- flow weighted average concentration

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 2 Wastewater Treatment grounding (courseKey class2-ww)

No dedicated bank folder exists in the repo for Class 2; the closest
matching bank structure is content/class1-treatment (the class1-wastewater
bank), deepened to the Class 2 scope in the OWWCO and WPI Need-to-Know
progression. Scope for this build: everything in Class 1 Wastewater at
greater depth, plus activated sludge process control (solids retention
time, food to microorganism ratio, sludge age management, wasting
strategy), nutrient removal awareness (nitrification and denitrification
fundamentals, alkalinity consumption at 7.14 mg as CaCO3 per mg of
ammonia nitrogen oxidized, phosphorus awareness), aeration systems and
dissolved oxygen control, clarifier performance analysis, effluent
disinfection at greater depth, solids processing (digester loading,
volatile solids reduction, gas production awareness), laboratory analysis
at greater depth (BOD seed and dilution quality, nutrient testing
awareness, microscopic examination awareness), pumps and hydraulics at
greater depth, instrumentation and process trending, safety at greater
depth, and Ontario Regulation 129/04 at the Class 2 level. Calculation
vocabulary: SRT and sludge age, F/M, oxygen requirements with given
factors, aeration detention and air supply awareness, clarifier solids
loading, WAS and RAS rates from mass balances with given values,
digester volatile solids loading and percent reduction, alkalinity
requirements for nitrification, chemical feed for phosphorus or
disinfection with given factors, percent removal across multiple stages.
Id prefix for this course: c2ww (c2ww-ladder01..100, c2ww-process01..100,
c2ww-error01..100, c2ww-evidence01..100, c2ww-mission01..100). Level:
"class1" (placeholder per FORMAT.md section 5; the contract has no
class2 level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), US EPA Municipal Wastewater
resources, US EPA nutrient and process control guidance, OWWCO exam
preparation resources, WPI 2025 Need-to-Know criteria for Wastewater
Treatment Class II, Ontario Regulation 129/04, CCOHS safety guidance.
