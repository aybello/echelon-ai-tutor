# SPEC: wpi-class2-wastewater exam-bank expansion (200 new questions)

- courseKey: wpi-class2-wastewater
- bankKey (use in every item): wpi-class2-wastewater
- Destination bank: wpi-class2-wastewater bank (bankKey wpi-class2-wastewater)
- Schema variant: treat
- Family: western; track: wastewater-treatment; level: 2

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

- Batch 1: wpi-class2-wastewater bank additions; questionNum 2251 to 2300; itemId WASTEWATER-TREATMENT-L2-251 to WASTEWATER-TREATMENT-L2-300.
- Batch 2: wpi-class2-wastewater bank additions; questionNum 2301 to 2350; itemId WASTEWATER-TREATMENT-L2-301 to WASTEWATER-TREATMENT-L2-350.
- Batch 3: wpi-class2-wastewater bank additions; questionNum 2351 to 2400; itemId WASTEWATER-TREATMENT-L2-351 to WASTEWATER-TREATMENT-L2-400.
- Batch 4: wpi-class2-wastewater bank additions; questionNum 2401 to 2450; itemId WASTEWATER-TREATMENT-L2-401 to WASTEWATER-TREATMENT-L2-450.

## Modules allowed for this course

Treatment Process Evaluation & Adjustment, Equipment Evaluation, Maintenance & Operation, Safety & Admin, Laboratory Analysis

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA: Municipal Wastewater — supporting treatment resources | https://www.epa.gov/npdes/municipal-wastewater
- US EPA - Resources for Wastewater Operators | https://www.epa.gov/compliance/resources-wastewater-operators
- WPI: 2025 Need-to-Know criteria | https://gowpi.org/services/2025-need-to-know-criteria/
- WPI: formula/conversion tables | https://gowpi.org/services/abc-testing/formula-conversion-tables/
- Canadian Centre for Occupational Health and Safety - Hydrogen Sulfide | https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html

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

## WPI Class 2 Wastewater Treatment grounding (courseKey wpi-class2-wastewater)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class II, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-treatment, deepened from the WPI Class 1 build to the
Class II scope: solids retention time and F/M control, process
control testing (settleability, oxygen uptake with given values,
microscopy awareness), anaerobic digestion operations (volatile
solids reduction, gas production with given values, volatile acids
to alkalinity awareness), disinfection dose and contact basics,
nutrient awareness, solids dewatering operations, laboratory QA/QC,
process troubleshooting, and operator supervisory awareness at the
Class II level, including cold climate operation. Regulation framing
stays generic: provincial wastewater requirements in general terms,
the federal Wastewater Systems Effluent Regulations in general
terms, and the CCME Canada-wide Strategy as context. Do NOT cite
Ontario regulations, and do NOT invent provincial regulation
numbers. Calculation vocabulary uses given values and factors so
every result is an exact decimal; no Hazen-Williams and no
exponential or logarithmic numerics. Id prefix for this course:
wp2ww (wp2ww-ladder01..100, wp2ww-process01..100,
wp2ww-error01..100, wp2ww-evidence01..100, wp2ww-mission01..100).
Level: "class1" (placeholder per FORMAT.md section 5; the contract
has no class2 level value yet, and this mapping is recorded in the
course BUILD-NOTES). Sources: Spellman Handbook of Water and
Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Wastewater Treatment Class II, CCME
Canada-wide Strategy for the Management of Municipal Wastewater
Effluent, the federal Wastewater Systems Effluent Regulations
(general reference), US EPA wastewater primer material (background),
CCOHS safety guidance.
