# SPEC: class2-water exam-bank expansion (200 new questions)

- courseKey: class2-water
- bankKey (use in every item): class2-water
- Destination bank: class2-water bank (bankKey class2-water)
- Schema variant: treat
- Family: ontario; track: water-treatment; level: 2

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

- Batch 1: class2-water bank additions; questionNum 2251 to 2300; itemId WATER-TREATMENT-L2-251 to WATER-TREATMENT-L2-300.
- Batch 2: class2-water bank additions; questionNum 2301 to 2350; itemId WATER-TREATMENT-L2-301 to WATER-TREATMENT-L2-350.
- Batch 3: class2-water bank additions; questionNum 2351 to 2400; itemId WATER-TREATMENT-L2-351 to WATER-TREATMENT-L2-400.
- Batch 4: class2-water bank additions; questionNum 2401 to 2450; itemId WATER-TREATMENT-L2-401 to WATER-TREATMENT-L2-450.

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

## Class 2 Water Treatment grounding (courseKey class2-water)

No dedicated bank folder exists in the repo for Class 2; the closest
matching bank structure is content/class1-water (modules listed in the
Class 1 Water grounding above), deepened to the Class 2 scope in the
OWWCO and WPI Need-to-Know progression. Scope for this build: everything
in Class 1 Water at greater depth, plus coagulation chemistry
(alkalinity consumption, jar test dose selection), enhanced sedimentation
(tube and plate settlers), filtration design and operation (dual media,
filtration and backwash rates, filter run optimization, slow sand
awareness), disinfection (CT calculations with baffling factors,
breakpoint chlorination curves, chloramine awareness), lime soda ash
softening with clean stoichiometry, iron and manganese oxidation and
sequestration, corrosion control indices awareness, membrane awareness
at an introductory level, hydraulics (head loss awareness, pump curves
and affinity laws with clean ratios), advanced sampling and laboratory
(alkalinity and hardness titrations, turbidity and particle awareness),
storage and distribution interface, safety and chemical handling at
greater depth, and Ontario Regulation 170/03 at the Class 2 level.
Calculation vocabulary: CT with baffling factor, chemical feed with
purity and solution strength corrections, softening chemical demands
with given factors, affinity law flow, head and power, backwash volumes
and rates, filter loading with multiple cells out of service, detention
and overflow rates for larger works, chlorine demand and decay style
calculations. Id prefix for this course: c2w (c2w-ladder01..100,
c2w-process01..100, c2w-error01..100, c2w-evidence01..100,
c2w-mission01..100). Level: "class1" (placeholder per FORMAT.md section
5; the contract has no class2 level value yet, and this mapping is
recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA
Surface Water Treatment Rule guidance, US EPA Small Drinking Water
Systems Handbook, OWWCO exam preparation resources, WPI 2025
Need-to-Know criteria for Water Treatment Class II, Ontario Regulation
170/03, CCOHS safety guidance.
