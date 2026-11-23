# SPEC: class4-ww exam-bank expansion (200 new questions)

- courseKey: class4-ww
- bankKey (use in every item): class4-wastewater
- Destination bank: class4-wastewater bank (bankKey class4-wastewater)
- Schema variant: treat
- Family: ontario; track: wastewater-treatment; level: 4

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

- Batch 1: class4-wastewater bank additions; questionNum 2251 to 2300; itemId WASTEWATER-TREATMENT-L4-251 to WASTEWATER-TREATMENT-L4-300.
- Batch 2: class4-wastewater bank additions; questionNum 2301 to 2350; itemId WASTEWATER-TREATMENT-L4-301 to WASTEWATER-TREATMENT-L4-350.
- Batch 3: class4-wastewater bank additions; questionNum 2351 to 2400; itemId WASTEWATER-TREATMENT-L4-351 to WASTEWATER-TREATMENT-L4-400.
- Batch 4: class4-wastewater bank additions; questionNum 2401 to 2450; itemId WASTEWATER-TREATMENT-L4-401 to WASTEWATER-TREATMENT-L4-450.

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
- plant and utility management
- BNR strategy leadership
- whole plant mass balances
- whole plant energy balances
- biosolids strategy leadership
- effluent quality strategy
- compliance leadership
- resource recovery awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- whole plant solids balance with given values
- nutrient balance with given values
- biogas energy quantity with given factors
- aeration energy benchmarking

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- digestion and biogas management
- dewatering program leadership
- energy management programs
- process technology evaluation
- pilot program leadership
- capital planning and asset strategy
- risk and emergency leadership
- regulatory leadership
Calculation topics (10 items spread across these; every result an exact decimal):
- biosolids production forecast with given yields
- capacity planning with peaking factors
- chemical program quantity with given ratios
- compliance sampling counts

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- inspection readiness leadership
- advanced laboratory quality management
- supervisory leadership
- workforce planning
- financial planning awareness quantities
- stakeholder communication
- performance benchmarking
- data systems for operations
Calculation topics (10 items spread across these; every result an exact decimal):
- energy per mass removed with given values
- dewatering haulage quantity
- nutrient removal capacity quantity
- program quantity with given rates

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- long term planning awareness
- climate resilience awareness
- regulatory change management
- management review and audit
- succession leadership
- continuous improvement leadership
- interutility cooperation awareness
- innovation evaluation
Calculation topics (10 items spread across these; every result an exact decimal):
- whole utility flow balance quantity
- solids forecast with given yields
- energy benchmarking comparison
- sampling program design counts

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 4 Wastewater Treatment grounding (courseKey class4-ww)

The repo holds no Class 4 wastewater bank folder, so the closest
matching bank structure is content/class1-treatment (the bank used for
class1-ww), deepened through the Class 2 and Class 3 builds to the
Class 4 scope in the OWWCO and WPI Need-to-Know progression. Class 4 is
the senior Ontario level: scope is plant and utility management,
advanced biological nutrient removal strategy and optimization
leadership, whole plant mass and energy balance evaluation, biosolids
strategy and program leadership, effluent quality strategy and
compliance leadership, energy management and resource recovery
awareness with given values, process technology evaluation and pilot
program leadership, capital planning and asset strategy awareness,
risk management and emergency leadership at utility scale, regulatory
leadership and inspection readiness, advanced laboratory and quality
system management, supervisory and overall responsible operator
leadership, and Ontario Regulation 129/04 at the Class 4 level.
Calculation vocabulary: whole plant solids and nutrient balances with
given values, nutrient removal capacity and chemical program quantities
with given ratios, digestion and biogas energy quantities with given
factors, dewatering and biosolids production forecasts with given
yields, aeration energy benchmarking per volume and per mass removed
with given values, capacity planning quantities with given peaking
factors, compliance sampling program counts. Use given values and
factors so every result is an exact decimal; no exponential or
logarithmic numerics. Id prefix for this course: c4ww
(c4ww-ladder01..100, c4ww-process01..100, c4ww-error01..100,
c4ww-evidence01..100, c4ww-mission01..100). Level: "class1" (placeholder
per FORMAT.md section 5; the contract has no class4 level value yet,
and this mapping is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA municipal wastewater resources, US EPA process
control and nutrient removal guidance, OWWCO exam preparation
resources, WPI 2025 Need-to-Know criteria for Wastewater Treatment
Class IV, Ontario Regulation 129/04, CCOHS safety guidance.
