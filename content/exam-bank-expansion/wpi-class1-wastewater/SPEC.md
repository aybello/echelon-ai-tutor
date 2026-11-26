# SPEC: wpi-class1-wastewater exam-bank expansion (200 new questions)

- courseKey: wpi-class1-wastewater
- bankKey (use in every item): wpi-class1-wastewater
- Destination bank: wpi-class1-wastewater bank (bankKey wpi-class1-wastewater)
- Schema variant: treat
- Family: western; track: wastewater-treatment; level: 1

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

- Batch 1: wpi-class1-wastewater bank additions; questionNum 2251 to 2300; itemId WASTEWATER-TREATMENT-L1-251 to WASTEWATER-TREATMENT-L1-300.
- Batch 2: wpi-class1-wastewater bank additions; questionNum 2301 to 2350; itemId WASTEWATER-TREATMENT-L1-301 to WASTEWATER-TREATMENT-L1-350.
- Batch 3: wpi-class1-wastewater bank additions; questionNum 2351 to 2400; itemId WASTEWATER-TREATMENT-L1-351 to WASTEWATER-TREATMENT-L1-400.
- Batch 4: wpi-class1-wastewater bank additions; questionNum 2401 to 2450; itemId WASTEWATER-TREATMENT-L1-401 to WASTEWATER-TREATMENT-L1-450.

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
- wastewater characteristics BOD and TSS
- screening
- grit removal
- primary clarification
- activated sludge basics
- trickling filters
- secondary clarifiers
- effluent disinfection basics
Calculation topics (10 items spread across these; every result an exact decimal):
- BOD loading
- surface overflow rate
- percent removal
- flow conversion

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- influent sources and variability
- comminutors and bar screens
- primary sludge and scum
- aeration basics
- rotating biological contactors
- return activated sludge
- waste activated sludge
- sampling and lab basics
Calculation topics (10 items spread across these; every result an exact decimal):
- clarifier detention time
- population equivalent mass load
- sludge volume index awareness
- chemical feed mass

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- preliminary treatment troubleshooting
- primary clarifier operation
- biological treatment troubleshooting
- dissolved oxygen basics
- settleability and SVI
- solids thickening basics
- digestion basics
- pumps and hydraulics for wastewater
Calculation topics (10 items spread across these; every result an exact decimal):
- aeration tank detention
- F/M awareness calculation
- pump run time
- wet well fill time

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- effluent quality basics
- dewatering awareness
- safety confined spaces
- safety hydrogen sulfide
- lockout and tagout
- regulation 129/04 licensing awareness
- record keeping
- operator duties
Calculation topics (10 items spread across these; every result an exact decimal):
- solids loading
- percent solids and mass
- flow and volume conversions
- removal efficiency across primary treatment

## Grounding (from the game build AUTHORING-BRIEF; binding)

## WPI Class 1 Wastewater Treatment grounding (courseKey wpi-class1-wastewater)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class I, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-treatment, transposed out of the Ontario framing:
preliminary treatment (screening, grit), primary clarification,
activated sludge basics, trickling filters and rotating biological
contactors, secondary clarification, disinfection basics, solids
handling basics (thickening, digestion awareness, dewatering
awareness), sampling and laboratory basics, pumps and equipment,
safety, and Class I operator duties, including cold climate
operation. Regulation framing stays generic: provincial wastewater
requirements in general terms, the federal Wastewater Systems
Effluent Regulations in general terms, and the CCME Canada-wide
Strategy for the Management of Municipal Wastewater Effluent as
context. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary mirrors the
Class 1 wastewater build: F/M ratio, sludge age from given values,
BOD and solids loadings, percent removal, clarifier surface and
weir loading, return sludge ratios, wasting rates, digester loading
with given values, all exact decimals; no Hazen-Williams and no
exponential or logarithmic numerics. Id prefix for this course:
wp1ww (wp1ww-ladder01..100, wp1ww-process01..100,
wp1ww-error01..100, wp1ww-evidence01..100, wp1ww-mission01..100).
Level: "class1" (the natural enum value for a Class I course; the
courseKey allowlist extension remains the outstanding contract item,
recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Wastewater Treatment Class I, CCME
Canada-wide Strategy for the Management of Municipal Wastewater
Effluent, the federal Wastewater Systems Effluent Regulations
(general reference), US EPA wastewater primer material (background),
CCOHS safety guidance.
