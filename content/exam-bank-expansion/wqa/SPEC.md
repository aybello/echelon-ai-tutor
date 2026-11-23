# SPEC: wqa exam-bank expansion (200 new questions)

- courseKey: wqa
- bankKey (use in every item): wqa
- Destination bank: wqa bank (bankKey wqa)
- Schema variant: treat
- Family: ontario; track: water-quality; level: 4

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

- Batch 1: wqa bank additions; questionNum 2251 to 2300; itemId WQA-251 to WQA-300.
- Batch 2: wqa bank additions; questionNum 2301 to 2350; itemId WQA-301 to WQA-350.
- Batch 3: wqa bank additions; questionNum 2351 to 2400; itemId WQA-351 to WQA-400.
- Batch 4: wqa bank additions; questionNum 2401 to 2450; itemId WQA-401 to WQA-450.

## Modules allowed for this course

Sampling & Sample Handling, Microbiological Analysis, Bench Chemistry, Calibration & Quality Control, Data Quality & Reporting, Laboratory Safety, Regulations & Certification

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- WPI: operator examination references — laboratory and treatment study resources | https://gowpi.org/services/abc-testing/exam-references/
- Ontario Regulation 169/03 - Ontario Drinking Water Quality Standards | https://www.ontario.ca/laws/regulation/030169
- Ontario Regulation 170/03 - Drinking Water Systems | https://www.ontario.ca/laws/regulation/030170
- Ontario Regulation 128/04 - Certification of Drinking Water System Operators | https://www.ontario.ca/laws/regulation/040128
- US EPA - Small Drinking Water Systems Handbook | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Sampling & Sample Handling] sampling program design
- [Sampling & Sample Handling] sample preservation
- [Sampling & Sample Handling] holding times
- [Sampling & Sample Handling] chain of custody
- [Microbiological Analysis] total coliform methods awareness
- [Microbiological Analysis] E. coli methods awareness
- [Bench Chemistry] pH measurement
- [Bench Chemistry] turbidity measurement
Calculation topics (10 items spread across these; every result an exact decimal):
- sample bottle planning counts
- dilution factor calculation
- holding time scheduling arithmetic
- result averaging

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Bench Chemistry] chlorine residual analysis
- [Bench Chemistry] alkalinity titration
- [Bench Chemistry] hardness analysis
- [Bench Chemistry] colour and metals awareness
- [Calibration & Quality Control] calibration standards
- [Calibration & Quality Control] blanks and duplicates
- [Calibration & Quality Control] matrix spikes awareness
- [Calibration & Quality Control] control charts awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- standard preparation quantity
- percent recovery calculation
- relative percent difference
- reagent preparation quantity

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Data Quality & Reporting] result calculation and review
- [Data Quality & Reporting] adverse result duties awareness
- [Data Quality & Reporting] reporting timelines awareness
- [Laboratory Safety] chemical hygiene and PPE
- [Laboratory Safety] housekeeping and waste
- [Regulations & Certification] regulation 169/03 standards awareness
- [Regulations & Certification] regulation 170/03 sampling context
- [Regulations & Certification] analyst certificate context 128/04
Calculation topics (10 items spread across these; every result an exact decimal):
- diluted result calculation
- summary statistics with given data
- sample count planning
- unit conversion for bench results

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Microbiological Analysis] result interpretation
- [Microbiological Analysis] quality control for microbiology
- [Bench Chemistry] instrument calibration checks
- [Calibration & Quality Control] data quality review
- [Sampling & Sample Handling] adverse sampling response awareness
- [Data Quality & Reporting] record retention awareness
- [Laboratory Safety] emergency procedures awareness
- [Regulations & Certification] sampling schedule duties
Calculation topics (10 items spread across these; every result an exact decimal):
- percent recovery with paired values
- average and range calculation
- bottle and volume planning
- dilution series calculation

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Water Quality Analyst grounding (courseKey wqa)

The registry entry is "Water Quality Analyst (WQA)", track
"water-quality", classLevel 4, questionBankKey "wqa": this is Ontario's
laboratory analyst certification, a distinct scope from the operator
classes, and the repo holds no dedicated wqa bank folder. Per the
build rule, this course proceeds on the closest matching existing
structure, the laboratory, sampling and water quality topic structure
inside content/class1-water and the treatment banks, and the scope
decision is recorded in the course BUILD-NOTES. Scope for this build:
drinking water sampling programs and sample handling (collection,
preservation, holding times, chain of custody), microbiological
analysis awareness (total coliform and E. coli methods and result
interpretation), bench chemistry analyses (pH, turbidity, chlorine
residual, alkalinity, hardness, colour, metals awareness), calibration
and quality control (standards, blanks, duplicates, spikes, control
charts awareness), result calculation and data quality review,
reporting and adverse result duties awareness, laboratory safety and
housekeeping, and the Ontario Drinking Water Quality Standards
(Regulation 169/03), Regulation 170/03 sampling context, and the
Regulation 128/04 analyst certificate context at a general level.
Calculation vocabulary: dilution factors and diluted result
calculations with given values, standard and reagent preparation
quantities with given concentrations, percent recovery and relative
percent difference with given paired values, result averaging and
summary statistics with given data sets, sample counts and bottle
planning, holding time and scheduling arithmetic, bench result unit
conversions. Use given values and factors so every result is an exact
decimal; no exponential or logarithmic numerics (pH is treated as a
measured scale value, never calculated from hydrogen ion
concentration). Id prefix for this course: wqa (wqa-ladder01..100,
wqa-process01..100, wqa-error01..100, wqa-evidence01..100,
wqa-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no wqa level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), OWWCO exam
preparation resources, Ontario Regulation 169/03, Ontario Regulation
170/03, Ontario Regulation 128/04, US EPA drinking water laboratory
quality assurance guidance, CCOHS laboratory safety guidance.
