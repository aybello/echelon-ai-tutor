# Class 3 Water Distribution remaining-original-question audit

**Date:** September 22, 2026
**Scope:** 453 original Class 3 Water Distribution questions that were not part of the 118-question repair release
**Status:** Read-only audit complete. No learner content changed.

## Bottom line

I cannot honestly call all 453 remaining original questions good yet. The audit found that **241 questions appear usable as-is**, **188 questions need editorial or source review**, and **24 questions should be repaired before the original bank is described as fully clean**. The live course remains strong from a quantity and commercial standpoint because it has **821 learner-visible questions**, but quality should be tightened before positioning the bank as manager-level or fully verified.

The safest money-first path is to keep the 821-question advantage live, then repair the 24 highest-risk items through the same guarded release pattern used for the previous Class 3 repair. Removing questions is not recommended because quantity is a competitive asset, and the identified issues can be corrected without shrinking the bank.

## Audit coverage

The audit extracted the exact 453-question set from the production database in a read-only transaction. The set excludes the 118 original questions already repaired and keeps only original question numbers 1 through 571. It does not include the 250 approved additions in question numbers 2001 through 2250.

A full first-pass review using Claude Fable 5.1 assessed all 453 questions. A second review using GPT-5.6 Sol reassessed the initial 27 highest-risk findings. It confirmed 22 as repair priorities, downgraded 3 to editorial review, and asked for source validation on 2. The Ontario watermain disinfection procedure and satellite-detection documentation confirmed that both source-dependent items also require repair. [1] [2] [3]

| Result | Count |
|---|---:|
| Appears usable as-is | 241 |
| Needs editorial or source review | 188 |
| Repair priority | 24 |
| Total audited | 453 |

## Deterministic screen findings

The deterministic screen found bank-wide metadata gaps and item-quality signals. These flags do not all mean a question is wrong, but they explain why the remaining original set should not yet be described as fully source-verified.

| Deterministic flag | Count |
|---|---:|
| missing-source-metadata | 453 |
| missing-governance-metadata | 453 |
| option-length-outlier | 162 |
| weak-distractor-pattern | 26 |
| regulatory-or-jurisdictional-claim | 13 |
| calculation-steps | 13 |

## The 24 questions that should be repaired first

These questions contain a confirmed wrong or ambiguous answer path, an internal contradiction, a non-functional assessment design, an inaccurate operational claim, or an objectively weak multiple-choice structure. Questions 166 and 353 received additional source checks. The Ontario procedure identifies tablet or continuous-feed disinfection as at least 25 mg/L for 24 hours and slug disinfection as at least 100 mg/L for 3 hours. [1] Satellite leak screening described by the supplier uses L-band synthetic-aperture radar, while NASA distinguishes radar from optical and infrared sensing. [2] [3]

| Question | Module | Main issue | Recommended action |
|---:|---|---|---|
| 19 | Processes | ambiguous_stem: Stem pairs 'surge tank or standpipe' as one device; a standpipe's primary function is storage and pressure/head maintenance, making option A ('additional storage capacity') also defensible. | Remove 'or standpipe' from stem and explanation so the item addresses surge tanks only, or rewrite as a standpipe question. |
| 43 | Processes | distractor_quality: 'Analyzing temporary workers' and 'Transients dont occur in distribution' are clearly irrelevant or absurd distractors. | Rewrite with three plausible, parallel-length distractors and split or simplify the stem. |
| 51 | Processes | distractor_quality: Option A 'A grading system for hydraulics courses' is clearly irrelevant to distribution hydraulics and not a plausible misconception. | Replace option A with a plausible misconception (e.g., 'line of total energy including velocity head') and shorten the key or lengthen distractors. |
| 61 | Processes | answer_key: Key says a system-wide leak survey is the 'most effective initial step', yet option B (audit of billing and meter records) reflects the standard first step of a water audit before field leak detection. | Rekey to the audit option or reword stem to ask for the field step after apparent losses are excluded. |
| 82 | Processes | numerical_contradiction: Explanation's 'Typical zone elevation range: 60-70m' conflicts with its own 275-700 kPa band, which spans only ~425 kPa (~43 m of head) before friction losses. | Correct zone elevation range to match pressure band (~40-45 m) or remove; verify Ontario minimum/maximum pressures. |
| 97 | Processes | ambiguous_distractor: Distractor 'Only saves money with time-of-use rates' is supported by the item's own explanation listing 'time-of-use rates (differential pricing)' as a requirement, making it arguably a second correct answer. | Remove or reword the TOU distractor (e.g., reference demand charges), fix typo, and balance option lengths. |
| 105 | Processes | formula_error: Correct option gives Q_avail = Q_test × ((Ps-Pr)/(Ps-140))^0.54, but explanation gives Qa = Qt × ((Ps-140)/(Ps-Pr))^0.54; the option's ratio is inverted relative to the explanation's (correct) form. | Correct option formula to ((Ps-Pd)/(Ps-Pr))^0.54, specify pitot formula units, and replace weak distractors. |
| 115 | Processes | technical_accuracy: Key states 'static pressure and residual pressure at the flowing hydrant'; these are measured at a separate residual (non-flowing) hydrant, with pitot at the flowing hydrant. Explanation repeats the error. | Revise key to 'static and residual pressure at the residual hydrant, pitot at the flowing hydrant'; fix stem plurality and isCalc. |
| 134 | Support Systems | factual_error: Stem equates 'corporation stop (curb stop)'; these are different fittings. Option B ('connect the service line directly to the watermain under pressure') actually describes a corporation stop, making two options defensible. | Remove '(corporation stop)' and ask only about the curb stop, or rewrite to distinguish the two fittings clearly. |
| 166 | Processes | technical_accuracy: Keyed option states 'Satellite-based leak detection using infrared imagery'; commercial satellite leak detection relies on L-band synthetic aperture radar, not infrared. Explanation's 'temperature anomalies' compounds the error. | Revise to 'satellite-based radar (SAR) leak detection' and align explanation; clarify scenario as area screening. |
| 175 | Processes | internal_contradiction: Explanation says volume is sized to "prevent rapid pump cycling" yet specifies "minimum 6 starts/hour"; cycling limits are maximums, so the direction is inverted. | Change to "maximum" starts/hour; rewrite distractors; fix typo; re-review. |
| 224 | Support Systems | likely_wrong_answer: Key says close branch valve first, then hydrant main valve. The hydrant main valve is normally closed; if flowing, closing the hydrant first then the branch (auxiliary) valve is standard. Explanation's 'prevent water hammer and control flow' contradicts using a gate valve to throttle. | Rewrite stem and key to reflect standard practice: close hydrant valve slowly, then close auxiliary valve for isolation. |
| 253 | Processes | distractor_quality: 'Controlling rust on vehicles', 'Corrosion control is optional', 'Only affects old pipes' are clearly irrelevant/implausible; key is identifiable by length alone. | Rewrite as focused stem with four concise, plausible options; verify orthophosphate dose and pH targets. |
| 255 | Administration | distractor_quality: 'Only test during actual emergencies', 'Generators are maintenance-free', 'Only test annually' are implausible; key is obvious by length. | Rewrite with plausible options; verify testing frequencies and durations against the applicable standard before publishing. |
| 256 | Support Systems | distractor_quality: 'An index of water satisfaction', 'LSI is not useful for distribution', 'Only positive LSI is acceptable' are clearly irrelevant; key identifiable by length. | Convert to a concise stem (e.g., meaning of negative LSI) with four plausible short options. |
| 257 | Processes | distractor_quality: 'A switch that transfers water', 'Manual switching is sufficient', 'ATS is only for hospitals' are clearly irrelevant; key is the only detailed option. | Rewrite with plausible, similar-length distractors focused on one ATS function. |
| 260 | Support Systems | distractor_quality: 'A movie about biology' and 'Only in warm climates' are clearly irrelevant; key is obvious by length. | Rewrite with plausible distractors of similar length; fix 'doesnt'. |
| 263 | Processes | distractor_quality: 'A type of pipe material' and 'Not a distribution system concern' are clearly irrelevant; key is identifiable by length. | Rewrite with concise, plausible options (e.g., growth temperature range); correct to "Legionnaires' disease". |
| 264 | Support Systems | regulatory_accuracy: Explanation states 'report to MOH if confirmed'; under O. Reg. 170/03 total coliform detection in distribution is an adverse result requiring immediate reporting, not reporting only after confirmation. | Correct explanation to immediate reporting and resampling per O. Reg. 170/03 Schedules; balance option lengths. |
| 317 | Processes | metadata_contradiction: 'isCalc':'yes' but the item contains no calculation, steps, or numeric data. | Set isCalc to 'no'; reword stem to ask what confirms leak-tightness and sanitary condition before commissioning; sharpen option A as clearly incorrect. |
| 353 | Processes | numerical accuracy: Explanation states 'Method 2 — 100 mg/L, 2-hour contact (tablet or slug method)'; AWWA C651 tablet method is 25 mg/L for 24 h and slug method is 100 mg/L for at least 3 h, so the option's '100 mg/L for 2h' is likely wrong. | Correct concentrations/contact times per current AWWA C651 and Ontario Watermain Disinfection Procedure; separate repair from new-installation requirements. |
| 372 | Processes | internal_contradiction: Keyed option describes 'do not consume (aesthetic issue)' while the explanation defines Do Not Consume as 'specific chemical situations' with bathing OK. | Redefine advisory types consistently (BWA, Do Not Use, Do Not Consume), correct the aesthetic characterization, and fix typos. |
| 403 | General | internal_contradiction: Option states 'ILI>3.0 indicates significant improvement potential' but explanation assigns '2-4 (good — some improvement possible)' and reserves 'significant improvement potential' for 4-8. | Align the option threshold with the explanation bands (or vice versa) and balance option lengths. |
| 404 | Processes | distractor_quality: Options 'The aesthetic appearance of the flushing crew's uniforms' and 'The number of social media posts' are clearly irrelevant, non-functional distractors. | Rewrite distractors as plausible flushing considerations and reference scouring velocity in the key. |

## What the 188 review items mean

The 188 review items are not confirmed wrong. Most need source verification, stronger distractors, clearer wording, better explanations, or metadata cleanup. They can remain live while the obvious defects are repaired, but they should not be counted as fully verified. The 3 questions that were downgraded from repair priority to editorial review are 206, 333, and 493.

## Recommended next step

The highest-value next step is a repair package for the 24 priority questions. The package should change only those rows, preserve the rest of the 821-question bank, add answer-level source evidence, and use a guarded production release with a fresh read-only plan, recovery evidence, exact digest confirmation, and post-write verification. Production should not be changed until the repair package is reviewed and explicitly approved.

## Audit artifacts

The private full audit artifacts are retained outside the repository because they include detailed question-level analysis and production extracts. The repository includes this summary and a compact CSV of the 24 repair-priority items.

## References

[1]: http://www.ontario.ca/page/water-main-disinfection-procedure "Ontario 2020 Watermain Disinfection Procedure"
[2]: https://asterra.io/resources/beyond-compliance-how-satellite-leak-detection-uniquely-solves-trunk-mains-challenges/ "ASTERRA satellite leak detection for trunk mains"
[3]: https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar "NASA Earthdata Synthetic Aperture Radar overview"
