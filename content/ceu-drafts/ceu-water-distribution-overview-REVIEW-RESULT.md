# Water Distribution Overview CE draft: review result

Draft: `content/ceu-drafts/ceu-water-distribution-overview.json`. This is one fix round on 2026-11-17. Nothing is committed.

- No ids changed.
- No `correctIndex` value changed. Every key in the real draft was already correct.
- The six SVG figures were not edited. The backflow figure was moved to a new place in the module 3 lesson.
- Answer positions are still balanced: checks 6/6/6/6, final 5/5/5/5, alternate final 5/5/5/5.

## Models and planted-error detection

GPT-6.2 Sol, GPT-6.2 Astra and Gemini 4 hydrogen reviewed review copies, not the real draft. The copies had six wrong `correctIndex` values and four altered lesson numbers.

| Unit | Plant | Sol | Astra | Gemini |
| --- | --- | --- | --- | --- |
| system-components | c3 key (A, surge tank); lesson "drops 27 ft ... 12 x 0.433" | both | both | both |
| operating-system | c6 key (B, altitude valve); lesson "56,799 gal" | both | both | both |
| maintenance-repair | c5 key (A, add air); lesson "known 103 gal" against 47.0 / 50.0 | both | both | both |
| quality-compliance | c5 key (A, clear well); lesson "Step 7" | both | both | both |
| final | operating-system-f2 key (B, 0.92 ft/s) | yes | yes | yes |
| final-alt | maintenance-repair-a4 key (B, pipe materials) | yes | yes | yes |

- **All three models caught 6 of 6 planted keys and 4 of 4 altered numbers.** None of these errors is in the real draft. The real draft has a 12 ft drop (45.9 psi), 56,398 gal, a 50.0 gal test volume and "Step 2".
- Sol and Astra gave the most substantive points. Gemini was terse but accurate, and it treated the electrical-ground and lead-inventory points as nits.

## Real findings fixed

### Calculations and figures
- operating-system lesson, tank example: it showed 1,256.6 x 6 = 7,539.8, but that product is 7,539.6. It now carries **1,256.64 ft2 and 7,539.84 ft3**, so the shown steps give 56,398 gal. The velocity step now reads 3.1416 x 0.44444 / 4 = 0.3491 (all three).
- operating-system-f1 explanation: it showed 706.9 x 4.5 = 3,180.9, which is wrong. It now reads **706.86 ft2, 3,180.87 ft3 and 23,792.9, or 23,793** (all three).
- operating-system facilitatorGuide (my own finding): it gave 23,794 gal and 3.67 ft/s, which did not match the f1 key (23,793) or the f2 key (3.68). Both values are fixed. The f2 explanation now shows 2.0045 / 0.54542.
- Diameters: the prompts for c2, f1, f2 and a1 and the lesson examples now say "inside diameter". The tank items also say "upright cylinder" (Sol, Astra, Gemini nit). The c2 explanation now uses 314.16 ft2 and 2,349.9 gal.
- maintenance-repair-f1 explanation: the 1,042 gal distractor is now explained as 7 percent of the recorded value. The true shortfall is 1,120 gal, which is 7 percent of actual use (Sol, Astra).
- quality-compliance-c2 explanation: 1.5 now "used a base of 100", and 67 is now "1,600 / 24 = 66.7 customers per call" (Sol, Astra).
- Linden Court meter example: true use is now labelled an estimate "assuming the tested accuracy held all quarter" (Sol, Astra).
- Willow Mill example: the result is now framed as the tank's average residence time, a rough guide to water age. It adds the active-volume case, 375,000 / 125,000 = 3.0 days (Sol, Astra).
- Demand-curve figure: the caption and lesson now state the assumption the figure draws, which is supply held near the day's average. The SVG is unchanged (Sol, Astra).

### Distribution-system statements
- The network is now "part of the public-health barrier", not "the treatment barrier" (Sol).
- Tank level sets the *static* pressure in the zone. Emergency supply now depends on gravity feed or backup power (Sol, Astra).
- Standpipe dead storage is now "for gravity service". Ground storage "usually sits too low", where it used to say it gives "no pressure of its own" (Sol, Astra).
- Water age in tanks: turnover and mixing manage age. Covers, screened vents and locking hatches keep material and people out. Water "drifts toward its surroundings" in temperature, where it used to say it "warms". quality-compliance now says "temperature changes" (Sol, Astra).
- Zone boundaries are now normally closed valves, with control points such as a PRV or pump station, where the old text said "one-way controls". Intrusion now happens when outside pressure exceeds main pressure, where it used to say "toward zero" (Sol, Astra).
- Cast iron now has "bell-and-spigot joints ... sealed with lead". Concrete is now described as prestressed concrete cylinder pipe, lined or embedded (Sol, Astra).
- Grids now "generally" give the best redundancy and "can" improve fire flow (Sol, Astra).
- Floating tank: fill or drain now follows the head in the main compared with the tank water surface. Separate inlet and outlet pipes "can" improve mixing. The plant and pump sizing claim was dropped. operating-system-c1 now says "single open pipe" and "filling and draining as head changes" (Sol, Astra).
- Gate valve: a non-rising stem uses a position indicator or a turn count from a known position, and throttling "can" damage the gate. The PRV setting fixes the pressure entering the lower zone, and customer pressure still varies. operating-system-a3 key text and explanation were changed to match. The altitude valve now reopens when the tank level drops. Water hammer is now a pressure wave that can be a rise or a drop (Sol, Astra).
- Dry-barrel hydrant: the barrel drains after closing, and plugged drains are covered by the utility procedure. The reason for running fully open is now correct: on many designs the drain stays partly open, so a partly open hydrant scours the soil. operating-system-c4 prompt and the a5 explanation (the drain port lets the barrel drain) were changed to match (Sol, Astra).
- Hydrant materials are now "approved ... normally by certification to the recognised drinking-water contact standard where required". The operating-system-f5 key and explanation were changed to match (Sol, Astra).
- Flushing discharge now goes "to an approved location, dechlorinated where required". The flow test now "estimates" flow at a stated residual pressure. operating-system-f4 prompt now says the utility paints by flow class (Sol, Astra).
- Fixed explanations:
  - system-components-c1, c4: the old reasons were wrong.
  - operating-system-c5: raising pressure is "not the purpose", not "not an effect".
  - system-components-f3: fire-flow reserve is defined by its purpose, and pumps may deliver it.
  - system-components-a5: valve consolidation can reduce isolation (Sol, Astra).
- system-components-f4 key: a PRV cannot raise ridge pressure. The key now reads "Split into pressure zones, with a booster for the ridge", and the explanation was changed to match (Astra).
- system-components-f5: option D ("pressure class marked") was true of ductile iron too. It is replaced by "Is welded into one length with no joints" (steel). The explanation no longer says that cast iron lacks flexibility (Sol, Astra, Gemini).

### Electrical and corrosion (safety)
- The lesson said "Service pipes must not be used as the electrical ground", which conflicts with electrical-code grounding and bonding. It now says household wiring should not *depend on* the water service as its ground. The electrical code governs grounding and bonding, and a plastic repair or meter change can break the path. Crews follow the utility's electrical-safety procedure before cutting pipe or removing a meter (Sol, Astra, Gemini).
- system-components-a4: the prompt now says "the only ground". The key now reads "Is unsafe, since a plastic repair can break the path". The explanations were changed to match. The system-components-c5 explanation was changed to match (Sol, Astra).
- system-components-c6 and the AC lesson line: worker inhalation is now the *main* concern, and the water-quality issue is no longer dismissed (Sol, Astra).

### Maintenance, meters and backflow
- Main repair: samples decide release "where bacteriological samples are required". maintenance-repair-c6 key now reads "Clear out trench dirt and inactivate microbes before use", and its explanation no longer calls clamp testing a pressure test (Sol, Astra, Gemini).
- Service connection is now "typical", and ownership is set by the utility's rules (Sol).
- Meters:
  - Turbine is now listed under velocity meters.
  - Compound meters have "two measuring elements".
  - Venturi and orifice meters are separated from proportional meters.
  - Ultrasonic now names both transit-time and Doppler.
  - AMR is "for example walk-by or drive-by". AMI gives "frequent interval readings".
  - Meter accuracy "can drift", and worn meters most often under-register. "Many" utilities test large meters more often.
  - maintenance-repair-f4 options and prompt were changed to match (Sol, Astra, Gemini).
- Cross-connections:
  - The definition now covers "actual or potential" links.
  - The claim that lawn irrigation is low hazard was removed. Protection now follows the hazard, the backflow type and the rules.
  - Backsiphonage now means pressure below atmospheric.
  - maintenance-repair-c3 is rewritten around an open car-wash tank, because a boiler loop is pressurised and so did not rule out backpressure (Sol, Astra).
- Backflow devices:
  - Air gap: an unobstructed vertical space above the flood-level rim, sized by rule. It now "breaks the physical connection", where it used to say "nothing can be drawn across". maintenance-repair-c4 and f5 were changed to match, and the f5 prompt now says the hose is attached to the outlet and submerged.
  - RPZ: the relief opens on the pressure differential "as when a check leaks". The maintenance-repair-c5 key and explanation were changed to match.
  - The residential dual check is now non-testable and not a substitute for a testable assembly.
  - AVB: no continuous pressure and no downstream shutoff.
  - Isolation now protects the building's own plumbing from the fixture. maintenance-repair-a3 option B and the explanation were changed to match.
  - Testing now covers testable assemblies, and air gaps are inspected.
  - maintenance-repair-f3 and a2 explanations were corrected (Sol, Astra).
  - The backflow figure was moved from the main-repair section into "Backflow assemblies" (Sol nit).
- maintenance-repair-c1: the tracer distractor is now "tracer-gas survey, which finds gas escaping the pipe" (Sol).
- Trench: protective systems "where the rules require them", and atmospheric testing where the excavation *or* confined-space rules call for it (Sol, Astra).

### Water quality and compliance
- Residual: treatment "removes or inactivates". The residual is what remains as water travels. A sharp drop is now a reason to check, not proof. An unexpected reading is repeated promptly under the reporting procedure, where the old text said "confirm before reporting" (Sol).
- Water age now counts from entry to the distribution system (Sol).
- Heron Flats: two end readings do not locate the loss. The operator checks readings in between and works with the supervisor. "The applicable rule or permit" now sets the residual (Sol, Astra).
- Complaints: the claim that a chlorine smell means fresh water was replaced with "measure the residual". "Direction of reversal" is now "note flow changes, hydrant use or valve work". quality-compliance-c4 explanation was changed to match, including the meter-failure and chlorine reasons (Sol, Astra).
- Coliform: follow-up is now "the rule requires, such as repeat samples, E. coli testing and, in some cases, an assessment". quality-compliance-c3 explanation was changed to match (Sol).
- Lead and copper: corrosion control "as the rule requires". The inventory classes are now the US rule's: lead, galvanized requiring replacement, non-lead, lead status unknown. quality-compliance-a3 key ("Classify each line, such as lead, non-lead or unknown") and explanation were changed to match. The quality-compliance-c5 explanation now says "typical source" (Sol, Astra, Gemini).
- Public notification now applies to "specified situations" for "the people served". The certification paragraph no longer promises exam coverage, and grade rules are left to the jurisdiction (Sol).

### Sources (my own)
- `sourceIds` now cite the two added EPA sources: `epa-distribution-tools` in modules 1 to 3, and `epa-backflow-issue-paper` in module 3. Before this change, modules 1 to 3 cited only the coliform and CDC pages. Both URLs returned HTTP 200 today.

## Longest-answer pattern

In my count before the fix, the correct answer was strictly the longest option in **22 of 64** questions. It was longest or tied for longest in **32 of 64**. The caller's figure of 25 likely used a different tie rule.

After the fix, it is strictly longest in **10 of 64** (16 percent) and longest or tied in **16 of 64** (25 percent). Both counts are well under 22.

How:
- Lengthened wrong options in maintenance-repair-c3, c5, a4; quality-compliance-c4, f2, f4, f5, a2, a3, a4; system-components-f4, f5, a4; operating-system-a3, a4, a5; maintenance-repair-f5.
- Trimmed keys in maintenance-repair-c5, quality-compliance-f2 and system-components-a4.

Every changed option that an explanation quotes was updated in that explanation, and no key moved. Five of the remaining ties are numeric (f1, a1, a2, maintenance-repair-f1, a1), where choice length is not a cue. No option contains a banned word.

## Rejected and why

- **Quote the NEC grounding-electrode rule (10 ft in earth, supplemental electrode)** (Sol, Astra): this is code detail outside a distribution operator's job, and it is a jurisdiction-specific number. The lesson now defers to the electrical code and authority and teaches the operator-level point (do not depend on the service; follow the electrical-safety procedure).
- **OSHA "deeper than 4 ft" atmospheric-testing trigger** (Astra): this is a regulatory number, which the brief excludes. The wording now points to the excavation and confined-space rules.
- **Name NSF/ANSI/CAN 61** (Sol, Astra): this is a standard number, and the brief allows only the standard type. The text says "the recognised drinking-water contact standard".
- **"Up to the point of delivery" and "where the system provides fire protection"** in the opening definition (Astra): this is pedantry at entry level, and the figure already ends at the meter and customer.
- **Conductivity requirement and full-bore qualifier for magnetic meters** (Sol): drinking water is conductive enough. The added detail would only clutter a recognition item.
- **Hydraulic-grade and datum wording throughout** (Sol): adopted once in the floating-tank paragraph in plain words ("head in the main compared with the tank's water surface"). Using it everywhere would make an entry-level course harder to read.
- **Heron Flats: plant reading may not match the parcel's residual at entry** (Astra): this is covered by the new sentence that two end readings do not locate the loss. A travel-time analysis is out of scope.
- **Rephrase the "The '...' choice is ..." explanation pattern** (Gemini): this is style only. It matches the reviewed model courses.
- **Ground tanks on high terrain as a worked case** (Astra): this is covered by "usually sits too low". A separate case is not needed.

## Leftover nits

- Module 1 lesson is now about 1,500 words (text only, figures removed: 1,503). Modules 2 to 4 are 1,426 / 1,399 / 1,372.
- maintenance-repair-c6 key (56 characters) and quality-compliance-c1, c5, c6 keys are still one to three characters longer than their nearest distractor. They count among the 10 strictly longest.
- The "Fire-flow reserve, which no pump is allowed to touch" distractor stays as it is. The explanation now corrects the misconception.
- The hydrant SVG caption still says "the barrel drains after use". This is consistent with the corrected text, and the SVG was not re-rendered.
- The NOTES file was not updated, because it is outside this task's edit scope. It still lists 4 sources, the pre-review word counts and "about half" longest answers.
- Module 4 has no figure. The course has six SVGs in total, which still meets the requirement of at least five.

## My own checks

- I read every lesson statement, worked example, evidence, rubric and facilitator line, check, final and alternate, and every explanation and distractor.
- I recomputed all 88 numbers with `python3 -I`. This covers the lesson examples, evidence and facilitator values, and every numeric question with each distractor's mistake: pressure from elevation at 0.433 psi per ft, tank draw-down, main velocity and volume, refill time, leak loss, meter accuracy and true use, water age, residual loss and complaint rate. The only errors were the ones listed above. No correct answer appears as a number in its own prompt.
- Scope:
  - Minimum pressure, velocity limits, service-line size, lateral size, meter and backflow test intervals, residuals, sample counts and closing times are each deferred to the applicable rule, utility standard, design engineer or program.
  - Main repair, disinfection, hydrant operation and backflow testing stay at concept and purpose level, with no step lists or doses.
- Figures match the text: source-to-tap, PRV zones, branched versus grid with a dead end, demand curve with the now-stated supply assumption, dry-barrel hydrant parts, and backflow symbols, which now sit beside the backflow text.
- Structure after the fixes:
  - The JSON parses and keeps its 2-space indent.
  - 4 modules, 6 checks each, 20 finals and 20 alternates.
  - The 64 ids and 64 prompts are unique and follow the id pattern. Every question has 4 distinct choices, and every final has an objective that names a module.
  - Activities total 210 minutes, and the last activity names the final assessment.
  - Every quoted choice in an explanation exists, and there are no banned words or "of the above" in options.

## Caveats

- Sources were checked for HTTP 200 only. No statement was verified line by line against a source.
- The hydrant, meter and backflow content relies on the EPA cross-connection issue paper and general operator-training practice. No hydrant- or meter-specific public source was found. An AWWA-linked or university operator-training page should be added once one can be confirmed.
- Corrosion coverage stays PART: bonding at meters was cut for length. Only continuity bonding and the electrical-safety procedure before cutting are mentioned.
- The lead inventory classes are named as the US rule's. Canadian learners should follow their province's requirements.
- The reviewer models saw the lessons with SVGs stripped, so the figure check is mine alone. The fixes in this round were not reviewed by a second model.
- No contact hours are awarded, and the 210-minute duration is not validated.
