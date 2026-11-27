# Review result: Reverse Osmosis for Water Operators (`ceu-reverse-osmosis`)

Draft only. Not committed, not registered. Version `2026-11-26.1`.

## Reviewers

- **Reviewed by: GPT Sol 6.2, model id `gpt-6.2-sol`** (exact id from `GET https://api.openai.com/v1/models`; a `gpt-6.2-sol-healthcare` variant is also listed and was not used).
- **Gemini neon did NOT review this course.** No Gemini credential is available in this environment, so the Gemini step was skipped. The owner must add a credential before a Gemini review can be recorded.
- Tool: `review/ro/review_course_sol.py`, adapted from `docs/handoff/tools/review_course.py` on origin/main. The Gemini call is removed, the endpoint is `https://api.openai.com/v1/chat/completions` with `Authorization: Bearer placeholder`, and each unit gets its module's textbook excerpts (`review/excerpts/`, from `ceusrc/wqc.txt` and `ceusrc/sp6.txt`).
- Note: `review/review_course_sol.py` (the path named in the brief) was overwritten by another run during this session, so this course's copy of the tool lives at `review/ro/review_course_sol.py`.

## Rounds and planted-error design

| Round | Seed | Outputs | Planted errors | Caught |
|---|---|---|---|---|
| 1 | 7 | `review/ro/round1/` | 13 (6 wrong keys, 3 explanation numbers, 4 lesson numbers) | 13 |
| 2 | 11 | `review/ro/round2/` | 12 (6 wrong keys, 2 explanation numbers, 4 lesson numbers) | 11 (missed: Cedar Basin stage number 2 to 7) |
| 3 | 23 | `review/ro/round3/` | 11 (6 wrong keys, 1 explanation number, 4 lesson numbers) | 10 (missed: same stage number) |

- Planted errors are made in a review copy only, never in the draft. `plants.json` in each round folder lists them.
- **Planted-error catch rate: 34 of 36 (94%).** The two misses were the same fictional stage label ("stage 2" changed to "stage 7" in the Cedar Basin example). The reviewer called the stage numbers fictional layout details.
- Three rounds were run, as the brief allows. Round 3 findings were fixed in a final patch, which was then validated and recomputed but not sent to a fourth review.

## Real findings and triage

Planted errors are not findings: the draft itself was correct on each of them (for example the key on the quiz item the reviewer called "wrong key" is the key in the draft). The table records the real findings only.

| # | Where | Finding | Verdict | Action |
|---|---|---|---|---|
| 1 | M2 lesson, flux; SOURCECHECK row 35 | Printed WQC eq. 8.63 `Am = F x Qt` does not balance units. | CONTRADICTED by the book's print; the draft is right | Checked on the book page (WQC p. 8.99, PDF page 26 of the pages-3 extract). Division kept; lesson already says the printed form does not balance. |
| 2 | Final item how-ro-works-f3 | 146.2 / 6.895 = 21.2, shown as "about 21". | Real rounding error | Choice and explanation now "About 21.2 psi". |
| 3 | Alternate pretreatment-fouling-a3 | 1.5 x 1.25 = 1.875, shown as "about 1.9". Distractor 0.4 is the rise, 0.375 points. | Real rounding error | Choice now "About 1.88 percent"; distractor "About 0.375 percent". |
| 4 | M1 lesson | Nanofiltration "sometimes called a softening membrane" attributed to Spellman. | Real misattribution; NOT COVERED row 20 | Attribution removed. |
| 5 | M1 lesson | MWCO defined as smallest molecule held back, with a 90 percent figure proposed by reviewer. | Wording; NOT COVERED row 16 | Reworded as a molecular mass at a stated share of solutes; no number added. |
| 6 | M1 lesson | "The Spellman handbook lists a lower range for what it calls RO" with no supporting table. | Unsupported comparison | Removed; the lesson now cites WQC Table 8.11 (200 to 1,200 psi inlet pressures). |
| 7 | M1 lesson | Electrodialysis reversal described as separating ions "by ion exchange"; "Spellman also describes" attribution. | Real wording error | Reworded: ions move through ion-exchange membranes under an electric field; no attribution. |
| 8 | M1 lesson | "Every particle filter"; "always saltier"; "must be backwashed"; "most popular". | Overstatements | Qualified ("conventional particle filters", "whenever salt is rejected", "usually backwashed", removed "most popular"). |
| 9 | M1 lesson | Pressure threshold: "well above 35 psi before any water crosses". | Real conflation of threshold and net flow | Restated: about 35 psi must be exceeded before net flow; useful production needs more. |
| 10 | M1 lesson, materials | Table 8.9 ratings described as good chlorine plus "temperature and chemical stability limited". | Mis-stated | Restated from Table 8.9 (CA chlorine good, solvent poor, pH 4.5 to 9). |
| 11 | M2 lesson | Rejection and salt passage called "share of mass" while the formulas use concentrations. | Real wording error | Defined as concentration percentages. |
| 12 | M2 lesson | "Operators often prefer salt passage"; conductivity "proportional per handbook". | Unsupported attribution | Removed; conductivity ratio presented as an estimate of the salt ratio. Harbor Pines values labelled conductivity passage and rejection. |
| 13 | M2 lesson | "Permeate needed is less than raw flow, by the recovery." | Ambiguous formula | Now: permeate = feed x recovery (decimal). |
| 14 | M2 lesson | "Solubility limit exceeded and salts precipitate" as an absolute cut-off. | Overstatement | Reworded: may exceed solubility and precipitate on the surface. |
| 15 | M2 lesson, pressure | Eq. 8.60 uses pressure differences; "higher pressure brings more foulants" unsupported. | Real formulation error; unsupported claim | Net driving pressure defined as hydraulic minus osmotic difference; assumptions for the 400 psi example stated; foulant sentence removed. |
| 16 | M2 lesson, pump energy | "Combined pump and motor efficiency" with output called shaft power. | Real inconsistency | Efficiency is pump efficiency; 75 hp is brake horsepower at the shaft, about 56 kW shaft power; motor losses noted. "Pump is the biggest energy user" removed. |
| 17 | M2 lesson, pump energy | Recovery said to change pump power. | Real error | Stated that at fixed feed flow, head and efficiency recovery changes energy per gallon, not pump power. |
| 18 | M2 lesson, temperature | "Membrane operating temperature range matters for membrane life." | Minor | Changed to "membranes have temperature limits" (WQC). |
| 19 | M3 lesson | "Anything the membrane does not pass collects at the surface." | Real error (rejected material can leave in concentrate) | Reworded. |
| 20 | M3 lesson, SDI | Test described as timing to plug the filter. | Real method error | Reworded as the time to collect a fixed volume, compared at start and after a set interval; no numbers. |
| 21 | M3 lesson | Cartridge placement, paper cartridge, "never reach", "upstream slipping" as certainty. | Overstatements | Typical layout; replacement at plant or manufacturer limit; "may mean". |
| 22 | M3 lesson, oxidants | "Polyamide is the most common"; damage "permanent". | Unsupported / overstated | Softened. |
| 23 | M3 lesson, scale | Salt "crystallises" whenever bulk concentration exceeds solubility; "salts remain dissolved". | Overstatement | Restated at the membrane surface; "less likely to precipitate". |
| 24 | M3 lesson, fouling | BOD sentence not in the excerpt; "three matter most" ranking; lead/tail signatures stated as fact. | Unsupported | BOD sentence removed; patterns labelled clues, not diagnoses. |
| 25 | M3 lesson, cleaning | "Municipal service" offline sentence; "every membrane"; "cleaning late shortens life". | Unsupported | Removed or made conditional. |
| 26 | M3 lesson, integrity | Oxidant and seal failures conflated with membrane damage; conductivity rise "not fouling"; particle count as confirmation. | Real mechanism error; overstatement | Separated: chemical degradation, element damage, seal bypass. Conductivity rise is a clue; the test must be the manufacturer's. |
| 27 | M3 Cedar Basin | Stage role not stated; percentage change not shown. | Clarity | Stage 2 identified as the last stage in the layout; 0.7 percentage point rise stated. |
| 28 | M4 lesson, normalised | "Normalised flow = measured x temperature factor" presented as full normalisation; "raw flow far below summer value" compares unlike values. | Real error | Relabelled "temperature-corrected flow"; comparison now 224 vs 230 gpm, about 2.5 percent; raw comparison removed. |
| 29 | M4 lesson | Temperature-only trend "belongs to the membrane". | Overstatement | Reworded (normalising makes trends easier to attribute). |
| 30 | M4 lesson, concentrate | "Stream is large compared with conventional waste". | Unsupported | Removed. |
| 31 | M4 lesson, post-treatment | LSI said to judge whether water will "dissolve protective layers"; "dissolved gases" pass through RO. | Real error | LSI restated as supersaturation or undersaturation with respect to calcium carbonate; CO2 specified. |
| 32 | M4 lesson, Alder Point | "This is particulate loading, not scale"; "cleaning alone would be followed". | Overstatement | Restated as most consistent with, and likely to recur. |
| 33 | M4 records | "What they will ask for". | Unsupported | "Commonly ask". |
| 34 | Quiz how-ro-works-f4 | Four choices all labelled "rated poor"; question asked which is poorer fit. | Real design flaw | Question now asks which material Table 8.9 rates poor; choices are the four material names; key unchanged (polyamide). |
| 35 | Quiz performance-arithmetic-f1 explanation | "79 percent divides by permeate plus concentrate" is arithmetically wrong (73.3 percent). | Real explanation error | Now "divides feed by feed plus concentrate, counting the concentrate twice" (78.9, about 79). |
| 36 | Quiz performance-arithmetic-f5 | "Combined efficiency" with brake horsepower. | Real inconsistency | "Pump efficiency"; "pressure rise across the pump". |
| 37 | Quiz operation-troubleshooting-f4 | "Under the permit or approval" in the key. | Real wording error | Choice now "More dissolved salts entering the receiving plant's flow". |
| 38 | Quiz operation-troubleshooting-f3 | "Lead-stage pressure rise" vs pressure drop in prompt. | Wording | Explanation now "pressure drop" wording. |
| 39 | Quiz operation-troubleshooting-f3 choice | Reviewer asked for the answer option to state a finding, not a cause. | Real wording point | Option now reads "Particle loading in the feed", matching the explanation. |
| 40 | Quiz operation-troubleshooting-a5 | "Falling loads are not typical RO hazards": a falling load is a real maintenance hazard, so the distractor was ambiguous. | Real ambiguity | Distractor replaced with "A pump curve that shifts with temperature"; explanation updated. |
| 41 | Quiz operation-troubleshooting-c4 explanation | "The salts stay in the concentrate" implies complete rejection. | Real overstatement | "Most feed salts are rejected into the concentrate." |
| 42 | Quiz performance-arithmetic-a2, a3, a5, c4, pretreatment-fouling-a3 | Distractor explanations: "inverts" wording, unit labels (gfd vs ft2/gpd), "skips conversion". | Wording | Restated as the reciprocal or reading errors; keys unchanged. |
| 43 | Quiz performance-arithmetic-a5 and final | Prompt did not say feed-pump motor energy; "24 thousand gallons" lacked "per hour". | Real ambiguity | Prompt says feed-pump motor energy; explanation says per hour. |
| 44 | Quiz performance-arithmetic-c3 | Prompt used feed pressure where the relation uses pressure differences. | Real wording | Prompt restated with hydraulic and osmotic pressure differences. |
| 45 | Quiz pretreatment-fouling-c1 | "Does not lower pump work" stated categorically. | Overbroad | Explanation restated (osmotic pressure is not how it helps). |
| 46 | Quiz operation-troubleshooting-c1, a1 | Normalised trend "belongs to the membrane"; "normal behaviour" distractor wording. | Wording | Restated. |
| 47 | Quiz operation-troubleshooting-a2 | "Normalised flow" for a temperature-only multiplier. | Real labelling | Prompt now asks temperature-corrected flow. |
| 48 | Quiz operation-troubleshooting-a3 | Explanation treated a suspected leak as confirmed. | Wording | Restated as "suggests" and "before the leak is found". |
| 49 | Quiz how-ro-works-f4 explanation | Inference about learner's mistake not supported. | Real | Removed. |
| 50 | Excerpt coverage (many rounds) | "NOT-IN-EXCERPT" items: module designs, CIP detail, controller trips, post-treatment, safety, MBR, normalising method, cleaning triggers. | False positive as errors (the excerpts do not contain them; they are not contradicted) | Kept as general practice with no numbers as rules; all 34 NOT COVERED claims are listed below. Not counted as errors. |
| 51 | Reviewer asks for "one of the excerpts" (Table 8.9) absent in round 2 | Excerpt gap | Excerpt coverage | Table 8.9 added to the M1 excerpt for round 3. |
| 52 | Reviewer: 2 ions not stated as ideal (final how-ro-works-f3) | Prompt states the ion count and constants. | False positive | Declined. |
| 53 | Reviewer: "design flux from design documents"; "0.746 kW per hp" | Operator guidance; standard conversion. | False positive | Declined. |

## NOT COVERED claims (34), with decision

No kept claim states a numeric limit, dose, residual, trigger or setting as a rule. Where a number remains, it is a formula, a unit conversion, or a constant stated inside a question prompt.

| SC row | Module | Claim | Decision in draft |
|---|---|---|---|
| 10 | M1 | Stream synonyms: reject, brine, product water | Kept as common usage; no number |
| 12 | M1 | Velocity keeps polarization small | Kept; no number |
| 16 | M1 | MWCO = smallest molecule retained, daltons | Reworded: molecular mass at a stated share of solutes; no number |
| 20 | M1 | NF called a softening membrane | Removed (wrong attribution) |
| 25 | M1 | Spiral wound construction | Kept; description only |
| 26 | M1 | Hollow fibre feed outside fibres | Kept; description only |
| 28 | M1 | Cross-flow vs dead-end; spiral wound not backwashed | "must" changed to "usually"; kept |
| 32 | M2 | Salt passage = Cp/Cf x 100 = 100 - rejection | Kept; formula |
| 36 | M2 | CF = 1/(1 - recovery) for near-complete rejection | Kept; formula, labelled for near-complete rejection |
| 38 | M2 | Salt balance | Kept; mass balance, worked example |
| 40 | M2 | Net driving pressure falls along the unit | Kept with stated assumptions |
| 43 | M2 | Fewer vessels per later stage; valve sets recovery | Hedged ("common layout", "within limits") |
| 44 | M2 | TMP = average inlet and outlet minus permeate | Kept; definition, own numbers |
| 46 | M2 | 0.746 kW per hp; specific energy | Kept; conversion constant |
| 47 | M2 | Colder water lowers flux; manufacturer factor | Kept; factor appears only as a constant in a prompt |
| 51 | M3 | SDI is a plugging test | Rewritten as a timed-volume test; no numbers |
| 54 | M3 | Chlorine damage permanent, raises salt passage | Softened ("can be permanent") |
| 56 | M3 | Non-oxidising biocide where oxidants not tolerated | Kept as "may be specified" |
| 58 | M3 | Calcium carbonate and calcium sulfate as scalants | Kept; no number |
| 60 | M3 | Scale shows first at the tail end | Softened ("tends to") |
| 61 | M3 | Antiscalant, acid, dosing set by designer | Kept; no dose stated |
| 62 | M3 | Lower recovery, lower CF and scale risk | Kept; general |
| 64 | M3 | Lead vs tail signatures | Labelled clues, not diagnoses |
| 66 | M3 | CIP and cleaner by foulant | Kept; no recipe |
| 67 | M3 | Cleaning triggers set by manufacturer | Kept; no trigger number |
| 68 | M3 | Reversible vs irreversible fouling | Reworded |
| 70 | M3 | Conductivity rise, vessel probing, integrity tests | Reworded; tests named generically |
| 73 | M4 | Controller trips; alarm tests | Kept; no setpoint |
| 74 | M4 | Normalised values trended; manufacturer method | Kept; factor is a stated prompt constant |
| 76 | M4 | Concentrate permit-controlled; large volume | Volume claim removed; permit sentence kept |
| 77 | M4 | Post-treatment: stabilise, degasify, corrosion control | Reworded (CO2; LSI definition) |
| 79 | M4 | Preserve idle membranes; flush before restart | Kept; generic, no procedure |
| 80 | M4 | Content of a useful RO log | Hedged |
| 81 | M4 | Piping and chemical hazards; facility procedures govern | Kept; recognition only |

## Revalidation (after the final patch)

Run with `review/validate_ro.py` (0 errors) and `rob/verify_calc.py`:

- 64 ids (24 checks, 20 finals, 20 alternates), all ids unique, all prompts unique.
- 4 choices each; correctIndex in range; no choice set with repeats.
- Positions: checks 6/6/6/6; finals 5/5/5/5; alternates 5/5/5/5.
- Banned option words (always, never, only, all, every, none, cannot, completely, entirely, solely, must): none. "any", "both", "neither": none in options.
- No correct option is strictly the longest.
- No correct option's leading number appears in its own prompt.
- Numeric answers: 23 recomputed with `python3 -I`, 0 mismatches.
- sourceIds all exist (`wqc-alley`, `spellman-hb`, `wef-mop11`, `epa-reuse`).
- Activity minutes: 60 per module, 240 in total. The last activity of the last module is the final assessment.
- Evidence contains "fictional" and is over 120 characters in each module; assignment over 100; rubric at least 3; facilitatorGuide over 200; objectives at least 2.
- Lesson words: 1,363 / 1,523 / 1,408 / 1,426 (lesson 2 is above the 1,500 target and below the 1,700 maximum). Headings 6 / 10 / 8 / 9. Seven original inline SVG figures, each under 3 KB, no style attributes.

## Open items

- Gemini review not done (no credential). Owner to add one.
- Book sources have no URL; `CeuSource` requires `url` (owner decision pending).
- Excerpt gaps the reviewer could not check: module designs, CIP detail, controller trips, post-treatment, safety. These stay as general practice with no numbers as rules.
- Cedar Basin stage number: the reviewer missed the planted change in two rounds; the stage label is fictional, so this does not affect the draft.
- Lesson 2 is about 23 words over the 1,500 target (1,523 words; the hard maximum is 1,700).
