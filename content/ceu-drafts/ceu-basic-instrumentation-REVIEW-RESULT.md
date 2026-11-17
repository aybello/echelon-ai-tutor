# Basic Instrumentation CE draft: review result

Draft: `content/ceu-drafts/ceu-basic-instrumentation.json`. One fix round on 2026-11-17, not committed. All ids are unchanged. No `correctIndex` value was changed, because every key in the real draft was already correct. No SVG markup was changed; one figure caption (outside the SVG) was edited. Answer positions are still balanced: checks 6/6/6/6, final 5/5/5/5, alternate final 5/5/5/5.

## Models and planted-error detection

GPT-6.2 Sol, GPT-6.2 Astra and Gemini 4 hydrogen reviewed review copies, not the real draft. The copies had six wrong `correctIndex` values and four altered lesson numbers. Three explanations in the copies also quoted choices that do not exist.

| Unit | Plant | Sol | Astra | Gemini |
| --- | --- | --- | --- | --- |
| measurement-fundamentals | c3 key (B, "travel farther"); lesson midpoint "27 mA" | both | both (see note) | both |
| pressure-level-flow | c6 key (A, "double"); lesson "Q = 9 x 0.7155" | both | both (see note) | both |
| analyzers-control | c5 key (A, residual trim); lesson "Output = 103 + 10 x 0.6" | both | both | both |
| scada-troubleshooting | c5 key (B, "test expires"); lesson "11 + 16 x 0.5" | both | both | both |
| final | pressure-level-flow-f2 key (B, 388 gpm) | yes | yes | yes |
| final-alt | analyzers-control-a4 key (B, sensor removed) | yes | yes | yes |

- **Sol: 6 of 6 keys, 4 of 4 numbers. Gemini 4 hydrogen: 6 of 6 keys, 4 of 4 numbers.**
- **Astra: the brief I was given says 4 of 6 keys, missing measurement-fundamentals-c3 and pressure-level-flow-c6. The Astra files in the review folder do flag both keys.** The measurement file says "c3 — `correctIndex: 1` ... Set `correctIndex: 0` (A)". The pressure-level-flow file says "c6 — `correctIndex: 0` ... Set `correctIndex: 2` (C)". If the 4 of 6 count comes from an earlier Astra run, it does not match these files. Astra caught 4 of 4 numbers.
- All three models flagged the three made-up explanation quotes: "69.5 percent" (mf-f3), "79.25 percent" (mf-a3) and "62 percent" (ac-c3). The real draft quotes 45.0, 51.5 and 40.
- None of the planted errors is in the real draft. However, the real worked example 2 in module 4 had its own error. It read "4 + 16 x 0.5, meaning 5.0 ft", which works out to 12 mA, not feet. The planted copy turned it into "11 + 16 x 0.5". The real version is fixed below.
- Sol and Astra were thorough, and most of the adopted points below came from them. Many of their other points were metrology or engineering pedantry (see Rejected). Gemini was short and accurate. It added the duplicate pump-control paragraph and the DO flow nit.

## Real findings fixed

### Calculations and signal arithmetic
- measurement-fundamentals lesson, worked example 2: "skipping the 4 mA offset gives 0.25 x 20 = 5.0 mA" combined both slips. It now says that skipping the offset gives 0.25 x 16 = **4.0 mA**, and using 20 as the span gives 4 + 0.25 x 20 = **9.0 mA**. "Always sense-check against the midpoint" was dropped, because it would not catch either slip. The new check is that a quarter of range sits a quarter of the way from 4 to 20 mA (Sol, Astra).
- scada-troubleshooting lesson, worked example 2: "4 + 16 x 0.5, meaning 5.0 ft" now reads (12.0 - 4) / 16 = 0.50 of range, and 0.50 x 10 ft = **5.0 ft**. A 6.0 ft screen reading is now "most likely" a 0 to 12 ft scaling, located in the PLC or screen scaling, rather than proven to be a display error (Sol, Astra, Gemini on the copy's version).
- measurement-fundamentals-f1 and -a2: the explanations said the 6.0 mA and 12.0 mA distractors were "below the live zero", which is false. They now say each distractor gives only the rise above the live zero (0.375 x 16 and 0.75 x 16), not the loop current (Sol, Astra).
- pressure-level-flow lesson, worked example 3: "0.80 x 0.894 = 0.7155" gives 0.7152, so it now reads 0.80 x **0.8944** (all three).
- pressure-level-flow lesson: "a small level error is a larger flow error at the top of the range" mixed up absolute and percent error. It now says the flow error in percent is about 1.5 times the level error in percent. A given error in feet is a bigger error in gpm at high flow and a bigger share of the reading at low head (Sol, Astra).
- pressure-level-flow-a3: the shown 0.349 x 4.0 gives 1.396, so the area is now 0.3492 sq ft. The 2,508 gpm distractor is now explained as putting the diameter into the radius formula (Sol, Astra).
- pressure-level-flow-f1: the 3.5 ft explanation now says the learner multiplied by 0.433 *and then added the 1.5 ft* (Sol).
- measurement-fundamentals-f3: the 4.7 percent explanation now says "percent of the reference value" (Sol, Astra).

### Instrument facts that were wrong or misleading
- Magnetic meter in a part-full pipe (lesson bullet, c4 explanation, M2 facilitator guide): "half full ... reads about twice the true flow" was dropped. The text now says the meter applies the full-pipe area, so it usually over-reads. Once the electrodes are uncovered, the reading is erratic or meaningless, and many meters raise an empty-pipe alarm. The c4 key ("high, because it assumes the pipe is full") stays, as the most likely answer in the stated scenario (Sol, Astra).
- Flumes and weirs: "its shape guarantees" now says this holds when the device is installed correctly and flowing freely. Head is read at the point the rating specifies, and a submerged device does not follow its free-flow rating. "Rating from its maker" is now "published or manufacturer's rating". Open channel now includes a sewer that is not running full, and flow is "area times average velocity" (Sol, Astra).
- Wet well example: "is 8.0 ft deep" now says it "holds 8.0 ft of water above" the transmitter. The old wording made the 12.0 ft reading in example 2 impossible (all three). Hydrostatic level is now explained by depth, not by "water weight" (Sol).
- Installation errors: "all produce a steady error that no calibration can fix" contradicted worked example 2, which puts the mounting height into the scaling. It now says that a known mounting height goes into the scaling, while the other errors need the installation corrected. An inspection of the installation can also expose a steady error (Sol, Astra).
- pressure-level-flow-f5: the explanation said that "sense water bridging two electrodes" is how a magnetic flow meter works. It now says this describes a conductance level probe (Sol, Astra).
- pressure-level-flow-f4: the explanation no longer claims that foam "usually" returns an early echo. Foam can also absorb the pulse and cause a lost echo, which is a different fault from the one in the question (Sol, Astra).
- pressure-level-flow-c5: the DP-transmitter distractor is now rejected because it needs a supply, not because it "cannot show one pressure" (Sol, Astra).
- Level "from above": the float touches the water, so only ultrasonic and radar "never touch the water". This also removed a clash with module 1, where a sensor "touches the process" (Sol). That module 1 definition now reads "by contact or, like radar, from a distance" (Sol, Astra).
- Bourdon tube: it is sealed at its far end, and a helix is a form of Bourdon tube. Ultrasonic flow meters are now labelled transit-time, with one line on Doppler. Propeller meters "can" read low or stop. Trapped air in liquid-filled impulse lines can make a DP signal offset, sluggish or unstable. Worked example 5 now states a full pipe, the inside diameter and the average velocity (Sol, Astra).
- 4-20 mA: current is now said to resist cable resistance "as long as the loop has enough supply voltage". Near 0 mA "points to" a dead loop (including a failed transmitter) instead of proving it. An empty tank gives 4 mA when empty is set as the bottom of the range. The scaling figure caption now adds "then add the bottom of the range if it is not zero" (Sol, Astra).
- Analyzers: a scratched turbidity cell "usually" reads high. Fouled *contacting* conductivity electrodes "tend to" read low. Low flow makes a *membrane (electrochemical)* DO sensor read low; optical sensors do not have the same flow need (all three). Sample conditioning must not change what is measured, because a strainer would remove the particles a turbidity analyzer must see. The analyzers-control-c2 key no longer says "clean" (Sol, Astra).
- Weight: weight lost over a known time gives the average feed rate, provided nothing is leaking. The analyzers-control-c6 explanation was changed to match (Sol, Astra).
- Speed: the dewatering-press example now uses a zero-speed switch that stops seeing motion. A plain proximity switch reports presence, not loss of motion (Sol).
- Control: a deadband "reduces" rapid cycling rather than preventing it. Integral action removes offset "as long as the output has room to move". The proportional example result is "56 percent output, the blower speed command". The "minimum automated feed system" is now explicitly the flow-paced, residual-trimmed system shown, since flow pacing alone needs no analyzer (Sol, Astra).
- analyzers-control-f4: the option "A higher alarm limit, which hides the gap" was wrong for a low-DO alarm, because raising it makes the alarm sound sooner. It is now "A changed alarm limit, which alters the warning". The explanations now say that a deadband lets an error sit without removing it, and an alarm limit changes the warning, not the control (Sol, Astra).
- Pump control: the return sludge pump was described as existing "to keep the wet well at a useful level". That misstates its purpose, which is returning settled solids. The lift station is now the classic level example, and a return sludge pump "may also run on level, though many plants pace it to flow". The duplicated pump-control paragraph in "Automatic loops in the plant" was removed (Sol, Astra; duplicate from Gemini).
- Worked example 4 (deviation alarm): the fixed alarm limits were never given. The text now says "even if 1.4 mg/L is still inside the fixed low and high alarm limits" (Sol, Astra).
- analyzers-control-c3: "adds 15 percent" is now "15 percent of output", to match worked example 2.

### Safety and roles
- Gas detector: "a detector that ... alarms without a cause is taken out of service for the technician" could teach an entrant to treat a real alarm as a faulty unit. The lesson now says to treat every alarm as real: leave the space and follow the facility procedure first. A suspected false alarm is checked only after everyone is safe (Sol, Astra). Confined-space monitoring now says "usually with a portable detector carried by the entrant, as the entry procedure sets" (Sol). It is still purpose-level, with no alarm values.
- Lockout: "stored and remote energy" put a SCADA command in the same class as energy. The lesson now lists energy sources (panel power, two feeds, an actuator held by air or a spring) and says that blocking a command is not isolating energy (Sol, Astra). The c6 key and explanation were already sound.
- Technician role: "the instrument technician, or another person the facility has trained and authorised", calibrates and reconfigures. The f4 key already says "under procedure" (Sol, Astra).

### Trends and troubleshooting
- A healthy 4-20 mA signal now "stays within 4 to 20 mA and follows the process", instead of "wobbles a little". Troubleshooting step 3 now asks whether the signal is "responding to the process". Step 2 no longer requires every sensor to be wet. "Most live signals" wobble. Agreement among related signals means a real process change "is likely", not certain (Sol, Astra).
- Worked example 1 (dead loop): 0.1 mA shows the screen value is not a valid level, and the tank level is unknown until checked. The screen shows the bad signal as 0.0 ft, and the loop current or a look at the tank tells the two cases apart (Sol, Astra).
- A small gap is normal when it is inside "the facility's verification tolerance, allowing for both instruments", not the "instrument's stated accuracy" (Sol, Astra). Worked example 3 now gives outflow greater than inflow as the reason the level should fall (Sol).
- scada-troubleshooting-f1: the 14.4 ft explanation now says it would match a 0-20 mA signal scaled 0 to 20 ft (Sol). scada-troubleshooting-a3: "a healthy loop stays between its limits" is now "4 to 20 mA is the normal measuring range ... as the transmitter's settings define" (Sol, Astra). scada-troubleshooting-a4: "real signals wobble" is now "most live flow signals show some noise, and these pumps are changing speed" (Sol).
- The secondary data highway is now described as a path that "links another group of devices or backs up the main one". Computer systems "can be" cost effective (Sol).

### Module 1 wording
- "Every number on a plant screen" is now "every measured value", because setpoints are typed, not measured. The sensor families are "grouped by what they report". In the Alder Fork example, discharge pressure "did not rise" instead of "no discharge pressure", since static head can remain. "Give or take a small amount" now says the uncertainty depends on the instrument and conditions. Drift records "can show" a need for repair (Sol, Astra).
- measurement-fundamentals-c6: the explanation said "these readings agree". It now says every test point has the same +2 psi error (Sol, Astra). measurement-fundamentals-a5: the dip is now "verified" (Sol, Astra).

### Question form (my own)
- Nine keys were clearly the longest option, which gives them away. I shortened them without changing their meaning: analyzers-control-c2, -c4 and -a4; pressure-level-flow-f5 and -a4; scada-troubleshooting-c5, -a3, -a4 and -a5. No explanation quotes a key. Two keys are still a little longer than their distractors (see Leftover nits).

## Rejected and why

- **Calibration means comparison only, with adjustment as a separate step (VIM definitions); rewrite mf-c5 option B** (Sol, Astra): rejected. Operator certification material and plant procedures use "calibrate" for check-and-adjust, and the course is written for that reader. The c5 key is correct in that usage, and the lesson already says verification does not change the instrument.
- **Gauge versus absolute pressure ("psig", vented tank) in pressure-level-flow-c3, -a1 and -f1** (Sol, Astra): rejected. Operator exams use "psi" on open wet wells and tanks to mean gauge pressure. Adding the reference would add clutter for an entry-level reader without changing any answer.
- **Zero-based DP range stated in every square-root item (f3, a2, worked example 4)** (Sol): rejected. The items already say the signal is not square-rooted and give the flow at the top of the DP span, which is the standard operator setup.
- **8.34 relabelled as (lb/day)/(MGD x mg/L) in analyzers-control-f1 and -a1** (Sol, Astra): rejected, as in the reviewed Chlorination and Math drafts. "8.34 lb per gal" is how formula sheets state it.
- **Display formula with LRV/URV in the lesson and every prompt; "US gallons" on every conversion; 1 ft = 0.3048 m exactly** (Sol, Astra): rejected as clutter. The lesson uses zero-based ranges throughout. The caption now covers a non-zero bottom of range, and the US-units convention is set course-wide.
- **Below-4 mA as "underrange or fault" in analyzers-control-a4; NAMUR-style fault bands** (Sol, Astra): rejected for a4, whose distractor is clearly not a deviation alarm. A3 and the lesson now point to the transmitter's settings instead. Fault-current thresholds are numbers we do not state.
- **scada-troubleshooting-f3 option D rewritten as "outside the valid range; check..."** (Sol, Astra): rejected. "The loop is broken or unpowered, not a real zero" is the standard reading of 0.2 mA at this level, and the lesson already lists the possible causes.
- **Limit switch reports only one end of travel (mf-c4); positive-displacement meters; inductive conductivity sensors; FMCW radar; sensor-family overlap (sludge density); recorders outside the feedback path; "with an element it controls"** (Sol, Astra): accurate, but too detailed for recognition level. Short hedges cover the points that mattered.
- **Unit labels in Ohm's-law distractor explanations (scada-troubleshooting-c3); troubleshooting order "not universally cheapest" (c4); totalizer outside the meter (c1)** (Sol, Astra): pedantic. Each explanation already names the operation mistake, and c4 asks for "a logical" sequence, not the only one.
- **pressure-level-flow-f2 intermediate "1.1155 cfs"** (Sol): rejected. As printed, 2.4 x 0.4648 = 1.1155, so the line is internally consistent, and the answer (501 gpm) is unchanged.

## Leftover nits

- scada-troubleshooting-c2 (key 52 characters, others 37 at most) and scada-troubleshooting-f5 (58 against 39) keys are still somewhat longer than their distractors.
- The magnetic-meter SVG still says "Reading is false" and "Area unknown". That matches the corrected text, so it was not re-rendered.
- The analyzers-control lesson is now 1,483 words (text only, figures removed), near the top of the range. The others are 1,405 / 1,481 / 1,413.
- Explanations keep the formulaic "The ... choice" pattern.
- The NOTES file was not updated (outside this task's edit scope). Its word counts and its "pump control: PART, no question item" note are from before this review.

## My own checks

- I read every lesson statement, worked example, evidence and facilitator value, check, final and alternate question, and every explanation. I checked distractors for defensibility, banned words and a named mistake.
- I recomputed every calculation with `python3 -I` (130 checks, including each distractor's arithmetic and the lesson, evidence and facilitator values). This covered 4-20 mA scaling both ways, error as a percent of span, head and pressure, flume ratings, square-root DP, area times velocity, pounds and percent of capacity, scale weight loss, sample-line delay, proportional output, Ohm's law and range-mismatch errors. The only arithmetic errors are the ones listed above. No correct answer appears as a number in its own prompt.
- Scope: no calibration frequencies, accuracy requirements, alarm levels, exposure limits or rule numbers. Gas detection and lockout are purpose-level only. There are no step-by-step procedures and no manufacturer-specific instructions. Fictional tolerance and deviation values are labelled as the facility's choice.
- Figures: the six SVGs (loop, 4-20 mA line, flume, magnetic meter, chlorine loop, step versus drift) still match the text. Each is under 3 KB (largest 2,120 bytes).
- Structure after the fixes: the JSON parses with 2-space indent kept. 4 modules, 6 checks each, 20 finals and 20 alternates. Ids and prompts are unique, every question has 4 choices, and there are no banned words in options and no "of the above". Activities total 180 minutes, and the last activity names the final assessment. Final `objective` values are module ids. 12 of 20 finals (60 percent) and 12 of 20 alternates are calculations or signal readings.

## Caveats

- Sources are general CCOHS, NIST and EPA pages, checked for HTTP 200 only. No instrumentation manual was used. The instrument content is general operator knowledge, reviewed here against general engineering knowledge, not against a cited text. An operator-training instrumentation manual should be added as a source once one is confirmed.
- The Royce U checklist (gap report) is covered as the NOTES table states. ORP, solids, sludge blanket, ammonia and nitrate analyzers are named with shared fouling and verification points, not described one by one. Pump control by pressure and by level is now one corrected paragraph, still with no question item.
- The reviewer models saw lesson text with the SVGs stripped, so the figure check is mine alone. The fixes in this round were not reviewed by a second model.
- No contact hours are awarded, and the 180-minute duration is not validated.
