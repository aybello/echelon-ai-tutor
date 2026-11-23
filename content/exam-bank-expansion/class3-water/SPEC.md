# SPEC: class3-water exam-bank expansion (200 new questions)

- courseKey: class3-water
- bankKey (use in every item): class3-water
- Destination bank: class3-water bank (bankKey class3-water)
- Schema variant: treat
- Family: ontario; track: water-treatment; level: 3

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

- Batch 1: class3-water bank additions; questionNum 2251 to 2300; itemId WATER-TREATMENT-L3-251 to WATER-TREATMENT-L3-300.
- Batch 2: class3-water bank additions; questionNum 2301 to 2350; itemId WATER-TREATMENT-L3-301 to WATER-TREATMENT-L3-350.
- Batch 3: class3-water bank additions; questionNum 2351 to 2400; itemId WATER-TREATMENT-L3-351 to WATER-TREATMENT-L3-400.
- Batch 4: class3-water bank additions; questionNum 2401 to 2450; itemId WATER-TREATMENT-L3-401 to WATER-TREATMENT-L3-450.

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
- membrane systems flux and recovery
- ultrafiltration operation
- reverse osmosis awareness
- UV disinfection and dose
- advanced oxidation awareness
- enhanced coagulation for organics
- process mass balances
- filter performance analysis
Calculation topics (10 items spread across these; every result an exact decimal):
- membrane flux and area with given values
- recovery and concentrate flow
- transmembrane pressure difference
- UV dose with given factors

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- disinfection strategy at plant scale
- CT management
- residuals management
- energy optimization awareness
- chemical optimization
- risk management and critical control points
- DWQMS awareness
- advanced laboratory QA
Calculation topics (10 items spread across these; every result an exact decimal):
- multi-unit mass balance
- residuals volume and solids mass
- energy per volume with given efficiency
- chemical optimization quantity

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- membrane fouling and cleaning
- UV lamp aging and monitoring
- coagulation optimization trials
- filter optimization studies
- source water protection planning
- supervisory and ORO duties
- inspection readiness
- emergency leadership awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- contactor CT calculation
- membrane fleet capacity
- solids production forecast
- storage capacity planning quantity

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- advanced process troubleshooting
- water quality management programs
- capital planning awareness
- asset management awareness
- regulatory reporting leadership
- operator team supervision
- process auditing
- technology evaluation awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- whole plant chemical quantity
- energy benchmarking per volume
- recovery flow balance
- sampling program counts

## Grounding (from the game build AUTHORING-BRIEF; binding)

## Class 3 Water Treatment grounding (courseKey class3-water)

The repo holds a partial Class 3 structure (content/class3-water-dist
exists for distribution; no Class 3 treatment bank folder), so the
closest matching bank structure is content/class1-water deepened through
the Class 2 build to the Class 3 scope in the OWWCO and WPI
Need-to-Know progression. Scope for this build: advanced treatment
process design and optimization awareness, membrane systems (micro and
ultrafiltration, reverse osmosis awareness) with given flux, recovery
and pressure values, ultraviolet and advanced oxidation awareness with
given dose factors, process mass balances across multiple units,
advanced coagulation and enhanced organics removal, filter performance
analysis and optimization, disinfection strategy and CT management at
plant scale, residuals management, energy and chemical optimization
awareness, risk management and critical control point awareness,
Drinking Water Quality Management Standard awareness at a general level,
advanced laboratory and quality assurance, supervisory and overall
responsible operator duties awareness, and Ontario Regulation 170/03
at the Class 3 level. Calculation vocabulary: membrane flux and area
requirements with given values, recovery and concentrate flows,
transmembrane pressure differences, UV dose with given intensity and
time style factors, multi-unit mass balances, chemical optimization
quantities, residuals volumes and solids masses, energy per volume with
given efficiencies, advanced CT and contactor calculations. Use given
values and factors so every result is an exact decimal; no exponential
or logarithmic numerics. Id prefix for this course: c3w
(c3w-ladder01..100, c3w-process01..100, c3w-error01..100,
c3w-evidence01..100, c3w-mission01..100). Level: "class1" (placeholder
per FORMAT.md section 5; the contract has no class3 level value yet,
and this mapping is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA membrane and UV guidance background, US EPA Surface
Water Treatment Rule guidance, OWWCO exam preparation resources, WPI
2025 Need-to-Know criteria for Water Treatment Class III, Ontario
Regulation 170/03, Ontario Drinking Water Quality Management Standard
(general awareness), CCOHS safety guidance.
