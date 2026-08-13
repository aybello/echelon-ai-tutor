# Exam Bank Gap Spec — Class 1 Wastewater Collection & Class 1 Water Distribution

## Purpose

Write new multiple-choice questions to close coverage gaps against the official OWWCO/WPI exam blueprint. These questions will be inserted into the production `questions` table.

---

## Database Schema

Table: `questions`

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `bankKey` | varchar | YES | `class1-wastewater-coll` or `class1-water-dist` |
| `questionNum` | varchar | YES | Sequential integer as string. Collection starts at 575+, Distribution starts at 568+ |
| `module` | varchar | YES | Must match one of the module names listed below |
| `difficulty` | varchar | YES | `easy`, `medium`, or `hard` |
| `question` | text | YES | The question text |
| `correctIndex` | int | YES | 0-indexed position of the correct answer in the options array |
| `explanation` | text | YES | 1-3 sentence explanation of why the correct answer is right |
| `steps` | JSON or NULL | NO | For calc questions only. Array of `{"l": "Step label", "c": "Step content"}` |
| `tip` | text or NULL | NO | Optional study tip |
| `isCalc` | varchar | YES | `yes` or `no` |
| `topic` | varchar or NULL | NO | Sub-topic tag (e.g., "Calculations"). Can be NULL |
| `options` | JSON | YES | JSON array of 4 answer strings: `["A text", "B text", "C text", "D text"]` |
| `cognitiveLevel` | varchar or NULL | NO | Can be NULL |

---

## Example Questions (from existing bank)

### Non-calc example (Collection):
```json
{
  "bankKey": "class1-wastewater-coll",
  "questionNum": "254",
  "module": "Maintain & Restore Collection System",
  "difficulty": "easy",
  "question": "What is 'lateral inspection' and why is it important?",
  "correctIndex": 1,
  "explanation": "Lateral (service connection) inspection uses specialized cameras launched from the mainline into individual service connections. Laterals are often the largest source of I&I due to age, shallow depth, and lack of maintenance.",
  "steps": null,
  "tip": null,
  "isCalc": "no",
  "topic": null,
  "options": ["Inspecting pipes that run sideways", "Inspecting service connections (laterals) from the main sewer using specialized cameras, as laterals are a major source of I&I", "Inspecting manholes from the side", "A type of surface inspection"],
  "cognitiveLevel": null
}
```

### Calc example (Distribution):
```json
{
  "bankKey": "class1-water-dist",
  "questionNum": "548",
  "module": "Processes",
  "difficulty": "medium",
  "question": "A 150 mm diameter watermain carries 18 L/s. What is the approximate water velocity in the main?",
  "correctIndex": 2,
  "explanation": "Convert the flow to m³/s, determine pipe area, and use V = Q/A.",
  "steps": [{"l": "Step 1 — Convert flow", "c": "18 L/s ÷ 1,000 = 0.018 m³/s"}, {"l": "Step 2 — Calculate pipe area", "c": "A = π(0.150 m)²/4 = 0.0177 m²"}, {"l": "Step 3 — Calculate velocity", "c": "V = 0.018 m³/s ÷ 0.0177 m² = 1.02 m/s"}],
  "tip": null,
  "isCalc": "yes",
  "topic": "Calculations",
  "options": ["2.04 m/s", "1.53 m/s", "1.02 m/s", "0.51 m/s"],
  "cognitiveLevel": null
}
```

---

## Bank 1: Class 1 Wastewater Collection (`class1-wastewater-coll`)

**Current state:** 574 questions across 6 modules.
**Start new questions at questionNum: 575**

### Existing modules:
- Maintain & Restore Collection System (151)
- Maintain Lift Stations (132)
- Security, Safety & Administrative Procedures (128)
- Monitor, Evaluate & Adjust Collection System (104)
- Operate Equipment (36)
- Evaluate & Maintain Equipment (23)

### New module to create: "Applied Science & Hydraulics"

This module does NOT exist yet. Create it. The official OWWCO exam allocates 12% to Applied Science topics.

**Write 65 questions for "Applied Science & Hydraulics":**

| Topic | Questions | Difficulty Mix | Notes |
|-------|---:|---|---|
| Hydraulic Concepts (head, pressure, flow, pump hydraulics) | 15 | 5 easy, 7 medium, 3 hard | Include static head, friction head, pressure head, pump efficiency |
| Basic & Applied Chemistry (pH, H2S, dissolved oxygen, BOD, chemical reactions) | 15 | 5 easy, 7 medium, 3 hard | Focus on wastewater-relevant chemistry |
| Electrical Concepts (volts, amps, ohms, circuits, motor starters, overload relays) | 12 | 4 easy, 5 medium, 3 hard | Practical electrical knowledge for collection operators |
| Public Health Principles (pathogens, coliform testing, disease transmission, microbiology) | 10 | 4 easy, 4 medium, 2 hard | Why collection systems matter for public health |
| Maps & Plans (blueprints, site diagrams, as-built drawings, GIS) | 8 | 3 easy, 3 medium, 2 hard | Reading and interpreting collection system plans |
| Units of Expression (metric/imperial conversion, common prefixes) | 5 | 2 easy, 2 medium, 1 hard | Non-calc conceptual questions about units |

### Add to existing module: "Operate Equipment" (currently 36 questions)

**Write 50 questions for "Operate Equipment":**

| Topic | Questions | Difficulty Mix | Notes |
|-------|---:|---|---|
| Pumps — centrifugal, screw, metering, pneumatic injector | 12 | 4 easy, 5 medium, 3 hard | Operation, troubleshooting, selection |
| Motors & Drives (single phase, poly phase, variable speed, coupled, gear) | 8 | 3 easy, 3 medium, 2 hard | |
| Generators (AC/DC, standby power, transfer switches) | 6 | 2 easy, 3 medium, 1 hard | |
| Valves (gate, check, butterfly, plug, air release, sluice gate) | 8 | 3 easy, 3 medium, 2 hard | |
| Pipes, Joints & Fittings (materials, joining methods, sizes) | 6 | 2 easy, 3 medium, 1 hard | |
| Measuring & Control Systems (flowmeters, telemetry, SCADA, alarms, level sensors) | 10 | 3 easy, 4 medium, 3 hard | |

### Add to existing module: "Maintain & Restore Collection System" (currently 151)

**Write 35 questions covering specific process gaps:**

| Topic | Questions | Difficulty Mix | Notes |
|-------|---:|---|---|
| Pressure Sewers & Forcemains (grinder pumps, STEP systems, air release) | 8 | 3 easy, 3 medium, 2 hard | Class 1 = Basic level per blueprint |
| Infiltration/Inflow Detection (flow metering, smoke testing, dye testing, correction) | 10 | 3 easy, 4 medium, 3 hard | Class 1 = Intermediate level |
| Physical Inspection — TV/CCTV (coding defects, equipment setup, reporting) | 8 | 2 easy, 4 medium, 2 hard | |
| Chemical Addition (root control, rodent control, grease removal, odour/H2S control) | 5 | 2 easy, 2 medium, 1 hard | |
| Construction Inspection (new sewer acceptance, mandrel testing, air testing) | 4 | 1 easy, 2 medium, 1 hard | Class 1 = Basic level |

**Collection total new questions: 150**

---

## Bank 2: Class 1 Water Distribution (`class1-water-dist`)

**Current state:** 566 questions across 4 modules.
**Start new questions at questionNum: 568**

### Existing modules:
- Processes (332)
- Support Systems (139)
- General (59)
- Administration (36)

### Expand module: "General" (currently 59 questions — should be ~35% of exam)

**Write 130 questions for "General":**

| Topic | Questions | Difficulty Mix | Notes |
|-------|---:|---|---|
| Safety Procedures (confined space, excavation, trenching, electrical safety, lockout/tagout, traffic control) | 35 | 10 easy, 15 medium, 10 hard | 14% of real exam! Currently severely underrepresented |
| Safety Equipment (PPE, gas detection, barricades, warning devices, first aid) | 15 | 5 easy, 7 medium, 3 hard | |
| Hydraulic Concepts (head, pressure, flow, pipe friction, pump curves, system curves) | 25 | 7 easy, 12 medium, 6 hard | Distribution-specific hydraulics |
| Electrical Concepts (circuits, motors, VFDs, SCADA basics, control panels) | 15 | 5 easy, 7 medium, 3 hard | |
| Applied Science (water chemistry, chlorine residual, pH, turbidity, corrosion, microbiology) | 20 | 6 easy, 9 medium, 5 hard | |
| Public Health (waterborne diseases, cross-connection, backflow, boil water advisories) | 12 | 4 easy, 5 medium, 3 hard | |
| Maps & Plans (reading blueprints, as-builts, GIS, system mapping) | 8 | 3 easy, 3 medium, 2 hard | |

### Expand module: "Administration" (currently 36 questions)

**Write 20 questions for "Administration":**

| Topic | Questions | Difficulty Mix | Notes |
|-------|---:|---|---|
| Emergency Response (watermain breaks, contamination events, boil water advisories, mutual aid) | 8 | 2 easy, 4 medium, 2 hard | |
| Maintenance Management (preventive maintenance programs, asset management, work orders) | 5 | 2 easy, 2 medium, 1 hard | |
| Record Keeping & Information Systems (daily logs, compliance reports, GIS, SCADA data) | 4 | 1 easy, 2 medium, 1 hard | |
| Public Relations & Security (customer complaints, system security, vandalism prevention) | 3 | 1 easy, 1 medium, 1 hard | |

**Distribution total new questions: 150**

---

## Quality Rules

1. **No repair narration or internal audit notes in explanations.** Explanations should teach, not narrate the question-writing process.
2. **All answers must be factually correct** based on standard Ontario/WPI wastewater collection and water distribution practice.
3. **Distractors must be plausible** — not obviously wrong. They should represent common misconceptions or partial truths.
4. **Difficulty calibration:**
   - `easy` = recall/recognition of basic facts and definitions
   - `medium` = application of knowledge to a scenario or comparison between concepts
   - `hard` = evaluation, troubleshooting, or multi-step reasoning
5. **Do NOT duplicate existing questions.** Each question must test a distinct concept or scenario.
6. **Explanations must be 1-3 sentences** explaining WHY the correct answer is right and briefly why the key distractor is wrong.
7. **For non-calc questions:** `isCalc` = `"no"`, `steps` = `null`, `topic` = `null`
8. **For calc questions:** `isCalc` = `"yes"`, `steps` = JSON array of step objects, `topic` = `"Calculations"`
9. **Options array must always have exactly 4 items.**
10. **correctIndex is 0-based** (0 = first option, 3 = last option). Distribute correct answers roughly evenly across positions 0-3.

---

## Delivery Format

Create a migration script at `server/seeds/examBankGapQuestions.ts` that exports the questions as an array and provides an `insertGapQuestions()` function that inserts them into the `questions` table using Drizzle ORM.

Alternatively, create a SQL file at `drizzle/seed_exam_gap_questions.sql` with INSERT statements.

Either format works — the key is that questions can be inserted in one operation.

---

## Summary

| Bank | New Questions | New Modules | Expanded Modules |
|------|---:|---|---|
| Class 1 Wastewater Collection | 150 | Applied Science & Hydraulics (65) | Operate Equipment (+50), Maintain & Restore (+35) |
| Class 1 Water Distribution | 150 | — | General (+130), Administration (+20) |
| **Total** | **300** | | |
