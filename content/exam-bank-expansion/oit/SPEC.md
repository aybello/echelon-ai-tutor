# SPEC: oit exam-bank expansion (200 new questions)

- courseKey: oit
- bankKey (use in every item): oit
- Destination bank: content/oit/questions/oit-water-500.json (100 new) and content/oit/questions/oit-wastewater-500.json (100 new)
- Schema variant: oit
- Family: ontario; track: oit; level: 0

## Schema variant rules

Field set (EXACTLY these fields, no more, no fewer):
questionNum, bankKey, stream, module, topic, difficulty, cognitiveLevel,
question, optionA, optionB, optionC, optionD, options, correctIndex,
correctAnswer, explanation, isCalc, formula, sourceTitle, sourceReference,
sourceUrl, blueprintObjective, reviewStatus, itemId.
- stream: "Water Treatment" for the water bank, "Wastewater Treatment" for the wastewater bank.
- topic: short lowercase phrase, bank style (e.g. "source-water assessment").
- formula: "" for conceptual items; the governing formula text for calc items.
- blueprintObjective: "<stream> - <module> - <topic>".
- sourceReference: "<one-line scope note for the cited source> - <stream> / <module> / <topic>". Use a plain hyphen, never an em dash.
- reviewStatus: "unreviewed".
- Calc items carry NO expression fields in this variant; the machine-checkable record goes in the batch verify file (see WORKER-BRIEF).

## Example conceptual item (from the existing bank; copy its shape exactly)

```json
{
 "questionNum": 1001,
 "bankKey": "oit",
 "stream": "Water Treatment",
 "module": "Water Treatment",
 "topic": "source-water assessment",
 "difficulty": "easy",
 "cognitiveLevel": "recall",
 "question": "What can an operator primarily determine from source-water assessment?",
 "optionA": "Determine finished-water compliance from rainfall",
 "optionB": "Identify source hazards affecting treatment",
 "optionC": "Set doses from watershed area",
 "optionD": "Estimate pathogens from colour alone",
 "options": [
  "Determine finished-water compliance from rainfall",
  "Identify source hazards affecting treatment",
  "Set doses from watershed area",
  "Estimate pathogens from colour alone"
 ],
 "correctIndex": 1,
 "correctAnswer": "Identify source hazards affecting treatment",
 "explanation": "The purpose of source-water assessment is to identify raw-water hazards and variability before selecting operating responses. Source conditions can change quickly, so treatment decisions begin with representative raw-water data.",
 "isCalc": "no",
 "formula": "",
 "sourceTitle": "US EPA - Small Drinking Water Systems Handbook",
 "sourceReference": "Treatment barriers, filtration, disinfection and small-system operations — Water Treatment / Source Water & Multiple Barriers / source-water assessment",
 "sourceUrl": "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT",
 "blueprintObjective": "Water Treatment - Source Water & Multiple Barriers - source-water assessment",
 "reviewStatus": "unreviewed",
 "itemId": "OIT-0001"
}
```

## Example calculation item (from the existing bank)

```json
{
 "questionNum": 1401,
 "bankKey": "oit",
 "stream": "Water Treatment",
 "module": "Math & Calculations",
 "topic": "turbidity removal",
 "difficulty": "hard",
 "cognitiveLevel": "application",
 "question": "During the morning operating review, raw-water turbidity is 12 NTU and settled-water turbidity is 0.6 NTU. What is the removal efficiency? Round to 1 decimal place.",
 "optionA": "76 %",
 "optionB": "95 %",
 "optionC": "100 %",
 "optionD": "90 %",
 "options": [
  "76 %",
  "95 %",
  "100 %",
  "90 %"
 ],
 "correctIndex": 1,
 "correctAnswer": "95 %",
 "explanation": "Removal = (influent - effluent) / influent x 100. (12 - 0.6) / 12 x 100 Therefore, the answer is 95 %.",
 "isCalc": "yes",
 "formula": "Removal = (influent - effluent) / influent x 100",
 "sourceTitle": "US EPA - Surface Water Treatment Rule Turbidity Guidance Manual",
 "sourceReference": "Coagulation, flocculation, sedimentation, filtration and turbidity — Water Treatment / Math & Calculations / turbidity removal",
 "sourceUrl": "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100ZLYM.TXT",
 "blueprintObjective": "Water Treatment - Math & Calculations - turbidity removal",
 "reviewStatus": "unreviewed",
 "itemId": "OIT-0801"
}
```

## Numbering

- Batch 1: oit-water bank additions (content/oit/questions/oit-water-500.json); questionNum 1501 to 1550; itemId OIT-1001 to OIT-1050.
- Batch 2: oit-water bank additions (content/oit/questions/oit-water-500.json); questionNum 1551 to 1600; itemId OIT-1051 to OIT-1100.
- Batch 3: oit-wastewater bank additions (content/oit/questions/oit-wastewater-500.json); questionNum 1501 to 1550; itemId OIT-1101 to OIT-1150.
- Batch 4: oit-wastewater bank additions (content/oit/questions/oit-wastewater-500.json); questionNum 1551 to 1600; itemId OIT-1151 to OIT-1200.

## Modules allowed for this course

Water Treatment, Disinfection, Water Quality & Sampling, Chemical Feed & Storage, Hydraulics, Ontario Regulations, Pumping Systems, Health & Safety, Math & Calculations, Wastewater Characteristics & Sources, Preliminary & Primary Treatment, Secondary & Biological Treatment, Disinfection & Effluent Quality, Nutrient Removal & Advanced Treatment, Solids Handling & Biosolids, Wastewater Collection Systems, Pumping & Hydraulics, Ontario Regulations & Safety, Lab & Monitoring, Math & Calculations

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA - Small Drinking Water Systems Handbook | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT
- US EPA: Surface Water Treatment Rules — supporting treatment resources | https://www.epa.gov/dwreginfo/surface-water-treatment-rules
- US EPA - Surface Water Treatment Rule Turbidity Guidance Manual | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100ZLYM.TXT
- Ontario Regulation 170/03 - Drinking Water Systems | https://www.ontario.ca/laws/regulation/030170
- Ontario Regulation 128/04 - Certification of Drinking Water System Operators | https://www.ontario.ca/laws/regulation/040128
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html
- WPI: formula/conversion tables | https://gowpi.org/services/abc-testing/formula-conversion-tables/
- US EPA - Resources for Wastewater Operators | https://www.epa.gov/compliance/resources-wastewater-operators
- US EPA - Alternative Wastewater Collection Systems Manual | https://nepis.epa.gov/Exe/ZyNET.exe?Index=Prior+to+1976&Query=&SearchMethod=1&FuzzyDegree=0&User=ANONYMOUS&Password=<redacted>&QField=pubnumber%5E%22625191024%22&UseQField=pubnumber&IntQFieldOp=1&ExtQFieldOp=0&Docs=
- US EPA - Start-Up of Municipal Wastewater Treatment Facilities | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=00000IDV.TXT
- Ontario Regulation 129/04 - Licensing of Sewage Works Operators | https://www.ontario.ca/laws/regulation/040129
- Canadian Centre for Occupational Health and Safety - Hydrogen Sulfide | https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Water Treatment] source-water assessment
- [Water Treatment] coagulation process
- [Water Treatment] rapid filtration
- [Disinfection] chlorine disinfection
- [Water Quality & Sampling] turbidity measurement
- [Hydraulics] head and pressure
- [Health & Safety] chemical handling safety
- [Ontario Regulations] drinking water regulation basics
Calculation topics (10 items spread across these; every result an exact decimal):
- detention time
- filter loading rate
- chlorine dose and demand
- flow conversion

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Water Treatment] sedimentation
- [Water Treatment] flocculation
- [Chemical Feed & Storage] chemical storage
- [Pumping Systems] pump types and operation
- [Water Quality & Sampling] sampling methods
- [Disinfection] CT value
- [Hydraulics] pipe flow and velocity
- [Ontario Regulations] operator certification
Calculation topics (10 items spread across these; every result an exact decimal):
- pipe volume
- percent removal
- solution feed rate
- storage detention time

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Wastewater Characteristics & Sources] biochemical oxygen demand
- [Preliminary & Primary Treatment] screening and grit removal
- [Secondary & Biological Treatment] activated sludge basics
- [Wastewater Collection Systems] sewers and manholes
- [Pumping & Hydraulics] lift stations
- [Ontario Regulations & Safety] confined space safety
- [Lab & Monitoring] wastewater sampling
- [Solids Handling & Biosolids] sludge thickening
Calculation topics (10 items spread across these; every result an exact decimal):
- BOD loading
- surface overflow rate
- percent removal
- flow conversion

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Secondary & Biological Treatment] trickling filters and RBCs
- [Disinfection & Effluent Quality] effluent disinfection
- [Nutrient Removal & Advanced Treatment] nutrient removal awareness
- [Wastewater Collection Systems] infiltration and inflow
- [Pumping & Hydraulics] wet wells and pumps
- [Ontario Regulations & Safety] sewage works licensing
- [Lab & Monitoring] settleability and SVI
- [Solids Handling & Biosolids] digestion basics
Calculation topics (10 items spread across these; every result an exact decimal):
- F/M ratio awareness
- sludge volume index
- wet well fill time
- pump run time

## Grounding (from the game build AUTHORING-BRIEF; binding)

## OIT course grounding (from content/oit banks in the repo)

Registry courseKey "oit" is Ontario OIT (water). Its sibling registry entry
"oit-ww" shares the OIT level for wastewater. This build's oit folder covers
the OIT level across both streams, as the pilot does (pilot topics span
water treatment; extend across wastewater too, matching the two banks).

Water bank modules (489 questions): Water Treatment 99, Water Quality and
Sampling 104, Hydraulics 101, Math and Calculations 96, Disinfection 32,
Health and Safety 20, Chemical Feed and Storage 15, Pumping Systems 12,
Ontario Regulations 10. Frequent topics: chlorine demand, chemical mass,
detention time, filter loading rate, CT value, head and pressure, pipe
volume, pipe velocity, flow conversion, storage detention, turbidity
removal, coagulation, source-water assessment.

Wastewater bank modules (483 questions): Wastewater Collection Systems 110,
Math and Calculations 94, Secondary and Biological Treatment 72, Pumping
and Hydraulics 47, Ontario Regulations and Safety 40, Preliminary and
Primary Treatment 36, Wastewater Characteristics and Sources 23, Lab and
Monitoring 19, Solids Handling and Biosolids 16, Disinfection and Effluent
Quality 15, Nutrient Removal and Advanced Treatment 11. Frequent topics:
BOD removal, BOD loading, sludge volume index, solids retention time,
food-to-microorganism ratio, aeration detention, sewer slope, pipe volume,
pump run time, wet-well fill time, force-main velocity, screening, grit
removal.

Bank sources to cite in task source lists: US EPA Small Drinking Water
Systems Handbook; Ontario Regulation 170/03; US EPA Surface Water Treatment
Rule Turbidity Guidance Manual; US EPA Alternative Wastewater Collection
Systems Manual; US EPA Resources for Wastewater Operators; US EPA Start-Up
of Municipal Wastewater Treatment Facilities; Ontario Regulations 128/04 and
129/04; CCOHS confined spaces and hydrogen sulfide guidance; Spellman
Handbook (pilot citations).
