# SPEC: wpi-class2-water exam-bank expansion (200 new questions)

- courseKey: wpi-class2-water
- bankKey (use in every item): wpi-class2-water
- Destination bank: wpi-class2-water bank (bankKey wpi-class2-water)
- Schema variant: treat
- Family: western; track: water-treatment; level: 2

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

- Batch 1: wpi-class2-water bank additions; questionNum 2251 to 2300; itemId WATER-TREATMENT-L2-251 to WATER-TREATMENT-L2-300.
- Batch 2: wpi-class2-water bank additions; questionNum 2301 to 2350; itemId WATER-TREATMENT-L2-301 to WATER-TREATMENT-L2-350.
- Batch 3: wpi-class2-water bank additions; questionNum 2351 to 2400; itemId WATER-TREATMENT-L2-351 to WATER-TREATMENT-L2-400.
- Batch 4: wpi-class2-water bank additions; questionNum 2401 to 2450; itemId WATER-TREATMENT-L2-401 to WATER-TREATMENT-L2-450.

## Modules allowed for this course

Treatment Process, Laboratory Analysis, Equipment O&M, Source Water, Safety & Admin

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA - Small Drinking Water Systems Handbook | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT
- US EPA: Surface Water Treatment Rules — supporting treatment resources | https://www.epa.gov/dwreginfo/surface-water-treatment-rules
- WPI: 2025 Need-to-Know criteria | https://gowpi.org/services/2025-need-to-know-criteria/
- WPI: formula/conversion tables | https://gowpi.org/services/abc-testing/formula-conversion-tables/
- WPI: operator examination references — laboratory and treatment study resources | https://gowpi.org/services/abc-testing/exam-references/
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- coagulation chemistry and alkalinity
- jar test dose selection
- tube and plate settlers
- dual media filtration
- CT with baffling factors
- breakpoint chlorination
- laboratory titrations
- chemical storage and handling
Calculation topics (10 items spread across these; every result an exact decimal):
- CT calculation with baffling factor
- chemical feed with purity correction
- alkalinity consumption
- filter loading with cells out of service

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- lime soda ash softening
- iron and manganese oxidation
- sequestration
- corrosion control indices awareness
- membrane awareness
- pump curves and affinity laws
- filter run optimization
- raw water quality changes
Calculation topics (10 items spread across these; every result an exact decimal):
- softening chemical demand with given factors
- affinity law flow and head
- backwash rate and volume
- chlorine decay style calculation

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- enhanced sedimentation performance
- filtration troubleshooting
- chloramine awareness
- disinfection by-product control
- particle counting awareness
- advanced sampling
- hardness and alkalinity analysis
- process trending
Calculation topics (10 items spread across these; every result an exact decimal):
- detention time in series units
- solids mass rate to filters
- solution feed with strength correction
- pump energy with given efficiency

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- coagulation under cold water conditions
- filter ripening and turbidity spikes
- storage and distribution interface
- chemical spill response
- supervisory duties awareness
- regulation 170/03 class 2 duties
- emergency response awareness
- optimization studies
Calculation topics (10 items spread across these; every result an exact decimal):
- overflow rate for larger works
- chlorine demand and dose
- tank turnover time
- percent removal across stages

## Grounding (from the game build AUTHORING-BRIEF; binding)

## WPI Class 2 Water Treatment grounding (courseKey wpi-class2-water)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Treatment Class II, in a western Canadian context. The closest
matching bank structure in the repo is content/class1-water, deepened
from the WPI Class 1 build to the Class II scope: CT calculations with
baffling factors, chemical feed corrected for purity and solution
strength, jar test interpretation and coagulation optimization, lime
soda ash softening awareness with given values, pump affinity laws
with given ratios (squares and cubes of given ratios are exact),
enhanced sedimentation and filtration performance analysis, iron and
manganese treatment, disinfection strategy basics, laboratory QA/QC,
process troubleshooting, and operator supervisory awareness at the
Class II level, including cold climate operation. Regulation framing
stays generic: provincial drinking water requirements in general terms
and the Guidelines for Canadian Drinking Water Quality as the federal
reference. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary mirrors the
Class 2 water build with given values and factors so every result is
an exact decimal; no Hazen-Williams and no exponential or logarithmic
numerics. Id prefix for this course: wp2w (wp2w-ladder01..100,
wp2w-process01..100, wp2w-error01..100, wp2w-evidence01..100,
wp2w-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class2 level value yet, and this
mapping is recorded in the course BUILD-NOTES). Sources: Spellman
Handbook of Water and Wastewater Treatment Plant Operations (3rd
ed.), WPI 2025 Need-to-Know Criteria for Water Treatment Class II,
Health Canada Guidelines for Canadian Drinking Water Quality, US EPA
Small Drinking Water Systems Handbook, US EPA Surface Water Treatment
Rule guidance (background), CCOHS safety guidance.
