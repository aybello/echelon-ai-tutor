# SPEC: oit-ww exam-bank expansion (200 new questions)

- courseKey: oit-ww
- bankKey (use in every item): oit-ww
- Destination bank: content/oit/questions/oit-wastewater-500.json (200 new, wastewater stream)
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

- Batch 1: oit-wastewater bank additions (content/oit/questions/oit-wastewater-500.json); questionNum 1601 to 1650; itemId OIT-1201 to OIT-1250.
- Batch 2: oit-wastewater bank additions (content/oit/questions/oit-wastewater-500.json); questionNum 1651 to 1700; itemId OIT-1251 to OIT-1300.
- Batch 3: oit-wastewater bank additions (content/oit/questions/oit-wastewater-500.json); questionNum 1701 to 1750; itemId OIT-1301 to OIT-1350.
- Batch 4: oit-wastewater bank additions (content/oit/questions/oit-wastewater-500.json); questionNum 1751 to 1800; itemId OIT-1351 to OIT-1400.

## Modules allowed for this course

Wastewater Characteristics & Sources, Preliminary & Primary Treatment, Secondary & Biological Treatment, Disinfection & Effluent Quality, Nutrient Removal & Advanced Treatment, Solids Handling & Biosolids, Wastewater Collection Systems, Pumping & Hydraulics, Ontario Regulations & Safety, Lab & Monitoring, Math & Calculations

Where a topic in the batch plan carries a [Module] prefix, the module field
is the bracket text and the topic field is the rest. Where there is no prefix,
choose the module from the allowed list that best fits the item (for
single-module courses the module is fixed).

## Source citations (rotate across these; every item cites one)

- US EPA - Resources for Wastewater Operators | https://www.epa.gov/compliance/resources-wastewater-operators
- US EPA - Alternative Wastewater Collection Systems Manual | https://nepis.epa.gov/Exe/ZyNET.exe?Index=Prior+to+1976&Query=&SearchMethod=1&FuzzyDegree=0&User=ANONYMOUS&Password=<redacted>&QField=pubnumber%5E%22625191024%22&UseQField=pubnumber&IntQFieldOp=1&ExtQFieldOp=0&Docs=
- US EPA - Start-Up of Municipal Wastewater Treatment Facilities | https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=00000IDV.TXT
- Ontario Regulation 129/04 - Licensing of Sewage Works Operators | https://www.ontario.ca/laws/regulation/040129
- Canadian Centre for Occupational Health and Safety - Hydrogen Sulfide | https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html
- Canadian Centre for Occupational Health and Safety - Confined Spaces | https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html
- WPI: formula/conversion tables | https://gowpi.org/services/abc-testing/formula-conversion-tables/

## Batch plan

### Batch 1 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Wastewater Characteristics & Sources] COD, TSS and pH effects
- [Preliminary & Primary Treatment] screen types and grit channels
- [Preliminary & Primary Treatment] primary sludge and scum handling
- [Wastewater Collection Systems] force mains
- [Pumping & Hydraulics] pump performance awareness
- [Ontario Regulations & Safety] hydrogen sulfide safety
- [Lab & Monitoring] dissolved oxygen measurement
- [Solids Handling & Biosolids] dewatering awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- solids loading
- clarifier detention time
- removal efficiency
- volume conversion

### Batch 2 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Secondary & Biological Treatment] aeration control
- [Secondary & Biological Treatment] secondary clarifier operation
- [Secondary & Biological Treatment] return and waste sludge control
- [Disinfection & Effluent Quality] chlorine contact and effluent quality
- [Nutrient Removal & Advanced Treatment] ammonia awareness
- [Wastewater Collection Systems] CCTV inspection awareness
- [Lab & Monitoring] composite sampling
- [Wastewater Characteristics & Sources] industrial discharge awareness
Calculation topics (10 items spread across these; every result an exact decimal):
- aeration detention time
- return sludge rate awareness
- chlorine dose mass
- sewer velocity

### Batch 3 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Secondary & Biological Treatment] foaming and bulking awareness
- [Disinfection & Effluent Quality] ultraviolet disinfection awareness
- [Solids Handling & Biosolids] anaerobic digestion and gas awareness
- [Wastewater Collection Systems] lift station alarms
- [Pumping & Hydraulics] force main velocity
- [Ontario Regulations & Safety] spill reporting duties
- [Lab & Monitoring] BOD test awareness
- [Wastewater Characteristics & Sources] flow variability
Calculation topics (10 items spread across these; every result an exact decimal):
- sludge age awareness
- percent solids and mass
- wet well drawdown time
- average flow calculation

### Batch 4 (50 items: 40 conceptual, then 10 calculation)
Conceptual topics (about 5 items each; vary the angle, scenario, and difficulty across items on the same topic):
- [Secondary & Biological Treatment] plant start-up awareness
- [Disinfection & Effluent Quality] effluent compliance basics
- [Solids Handling & Biosolids] biosolids handling
- [Wastewater Collection Systems] odour control
- [Pumping & Hydraulics] pumping energy awareness
- [Ontario Regulations & Safety] lockout and tagout
- [Lab & Monitoring] laboratory quality control awareness
- [Ontario Regulations & Safety] operator licensing classes
Calculation topics (10 items spread across these; every result an exact decimal):
- mass loading calculation
- combined detention calculation
- chemical feed mass
- multi-stage percent removal

## Grounding (from the game build AUTHORING-BRIEF; binding)

(grounding section not found in brief; follow the topic plan and source list in this SPEC)
