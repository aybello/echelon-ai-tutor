# Notes: ceu-lime-softening

Stream `drinking_water` (the schema allows one value; it is shared with wastewater courses).

## Sources
spellman-hb (sp6), spellman-wwo1 (sp3), spellman-wwo2 (sp2), wqc-handbook (wqc.txt), niosh-ca-hydroxide and niosh-ca-oxide (the two web sources, both return 200). Book sources have no `url`, matching how `wef-mop11` is written in the sludge thickening course. The California range of knowledge (ceusrc/ca-treat.txt) has no lime softening content, so it was only scope-checked.

## Counts
4 modules, 24 checks (6 each; positions 6/6/6/6), 20 finals and 20 alternates (5 per module; positions 5/5/5/5), 4 choices each, 64 unique ids and prompts. Lessons: about 1,230, 1,325, 1,195 and 1,255 words, six or more `###` headings each. Six original SVG figures (M1 one, M2 one, M3 two, M4 two), each under 3 KB, rendered at 390 px and viewed (lime-build/../diagrams-lime). Activities sum to 240 minutes and the last activity is the final assessment.

## Constants used (stated in each question)
2.50 (Ca to CaCO3), 4.12 (Mg to CaCO3), 17.1 mg/L per gr/gal, CaO per mg/L: 1.27 (CO2), 0.56 (bicarbonate alkalinity as CaCO3), 2.31 (Mg); soda ash 1.06; 8.34 lb/gal; 56.1 and 74.1 molecular weights; 44/74 and 44/24.3 (recarbonation); alkalinity = mL x N x 50,000 / sample mL; sludge assumption of 2 parts CaCO3 per part of hardness removed (stated in the prompt).

## Unsure or unsupported by the texts
See SOURCECHECK: 27 lesson claims are NOT COVERED. These include the lime reaction equations and constants (derived), split treatment detail, solids-contact description, recarbonation order and acid alternative, excess CO2 redissolving carbonate, post-precipitation wording, sludge disposal options, volumetric and gravimetric feeders, and temperature and pH meter calibration. All are kept qualitative with no numbers from outside sources. Module 3 is the thinnest: the textbooks give no detention times, rates or design numbers, so none appear.

## Scope limits applied
No regulatory numbers, no exposure limits, no first-aid or spill steps. Safety is recognition and purpose only. Typical pH values and hardness classes are labelled typical and cited to Spellman.

## Royce U gap table (lspp)
See gap-report-lime-softening.md: topics 42, YES 28, PART 13, NO 1 (after gap fill). PART and NO items were either not supported by the textbooks or declined (safety procedures, design numbers).

## Review round changes (2026-11-26)
Second-model review with GPT Sol 6.2 only; Gemini did not review (no credential). Three rounds, 40 of 40 planted errors caught. Full triage, findings table and revalidation in `ceu-lime-softening-REVIEW-RESULT.md`. Pre-review backup: `ceu-lime-softening.pre-review.json`. Added source `wtp-gibson-reynolds` (Water Treatment Plant Operation, Gibson and Reynolds, 1988; no URL). Feeder answer now 84.4 lb/hr with the rounding stated in the prompt.
