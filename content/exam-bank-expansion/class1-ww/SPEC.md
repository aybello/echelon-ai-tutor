# SPEC: class1-ww exam-bank expansion (200 new questions)

- courseKey: class1-ww
- bankKey (use in every item): class1-wastewater
- Destination bank: content/class1-treatment/questions/wastewater-250.json
- Schema variant: treat
- Family: ontario; track: wastewater-treatment; level: 1

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

- Batch 1: class1-wastewater bank additions (content/class1-treatment/questions/wastewater-250.json); questionNum 2251 to 2300; itemId WASTEWATER-TREATMENT-L1-251 to WASTEWATER-TREATMENT-L1-300.
- Batch 2: class1-wastewater bank additions (content/class1-treatment/questions/wastewater-250.json); questionNum 2301 to 2350; itemId WASTEWATER-TREATMENT-L1-301 to WASTEWATER-TREATMENT-L1-350.
- Batch 3: class1-wastewater bank additions (content/class1-treatment/questions/wastewater-250.json); questionNum 2351 to 2400; itemId WASTEWATER-TREATMENT-L1-351 to WASTEWATER-TREATMENT-L1-400.
- Batch 4: class1-wastewater bank additions (content/class1-treatment/questions/wastewater-250.json); questionNum 2401 to 2450; itemId WASTEWATER-TREATMENT-L1-401 to WASTEWATER-TREATMENT-L1-450.

## Modules allowed for this course

Wastewater Treatment

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

## Class 1 Wastewater Treatment grounding (courseKey class1-ww)

Destination bank in the repo: class1-wastewater, authored in
content/class1-treatment (250 wastewater candidates: 200 conceptual and
50 worked calculations, alongside the Class 1 Water set). Scope for this
build: wastewater characteristics (BOD, TSS, pH), preliminary treatment
(screening, grit), primary clarification, secondary and biological
treatment at an introductory level (activated sludge basics, trickling
filters, rotating biological contactors, aeration, secondary clarifiers,
return and waste activated sludge), disinfection of effluent, solids
handling (thickening, digestion basics, dewatering awareness), sampling
and laboratory basics (BOD, TSS, DO, pH, settleability, SVI awareness),
pumps and hydraulics for wastewater, safety (confined spaces, hydrogen
sulfide, lockout), and Ontario Regulation 129/04 licensing awareness at
an introductory level. Calculation vocabulary: BOD and solids loading,
population equivalent style mass loads, clarifier surface overflow rate
and detention, aeration tank detention and F/M awareness, sludge volume
index, percent removal, chemical feed mass, pump and wet-well timing,
flow conversions. Id prefix for this course: c1ww (c1ww-ladder01..100,
c1ww-process01..100, c1ww-error01..100, c1ww-evidence01..100,
c1ww-mission01..100). Level: "class1". Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA
Municipal Wastewater resources, US EPA Start-Up of Municipal Wastewater
Treatment Facilities, OWWCO exam preparation resources, WPI 2025
Need-to-Know criteria, Ontario Regulation 129/04, CCOHS safety guidance.
