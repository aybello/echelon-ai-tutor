# Review result: California Water Treatment Operator, Grade T1 bank

Reviewed 2026-11-16 by Opus, Gemini 4 hydrogen and GPT-6.1 Sol (review by Claude models is the owner's verification authority for this content; the other two were added at the owner's request).

## How the bank was built

The owner supplied the State Water Board's **Expected Range of Knowledge for the Drinking Water Treatment Exam (Rev. 4/2020)**. The bank follows its T1 question counts by content category, scaled from 100 to 250: source water 63, water treatment processes 62, operation and maintenance 50, laboratory procedures 38, regulations, administrative duties and safety 37. Only objectives labelled T1 to T4 were used; objectives labelled T2 and above were left out, as the dossier requires. The outline lists no T1 objectives for coagulation, flocculation, sedimentation, fluoridation, blowers, compressors, generators, alkalinity, conductance, fluoride or colour analysis, so the bank has none on those. Writers worked one batch at a time and wrote original questions from the objective list.

**Coverage check.** After the first 250 were written, GPT-6.1 Sol matched each of the 156 T1 objectives to the questions. 128 were covered (49 of them by only one question) and 28 were uncovered or only touched in passing. About nine of those depend on exact numbers or on operator certification (acceptable residual and pH ranges, disinfectant MCLs and MRDLs, drinking water monitoring requirements, turbidity level requirements, certification requirements), which the dossier says not to test, and they were left out on purpose. A sixth batch of 30 questions (28 conceptual, 2 calculations) covers the rest that can be tested at concept level (the Groundwater Rule, well depth and drawdown measurement, wellhead pressure, chain of custody, sample containers, free and total chlorine analysis, colorimeter, pH meter and turbidimeter use, safety equipment, confined-space awareness, and others). The coverage check was not run again after the sixth batch.

The bank now has **280 questions: 208 conceptual and 72 calculations.** This is above the 250 first-release target; it can be cut back if the owner prefers.

## The review

All 280 questions were read in two halves of 140 by Opus (one reviewer per half), by GPT-6.1 Sol and by Gemini 4 hydrogen. Each half held two planted errors: a wrong answer key and a changed word or number in an explanation. **All three reviewers caught all four (4 of 4).** The reviewers checked each key, whether a wrong option could also be right, each explanation, every calculation redone from the stated constants, giveaway wording, and scope against the T1 objective list and the dossier's exclusions.

**Real problems found and corrected (about 90 rows):**
- Near-duplicate wrong options (CA-T1-TREAT-158, 178, 180) and wrong values sitting next to the right one (276, 278).
- A calculation whose answer equalled a number in the question (247, now 40 gal/day at 10 percent giving 33.4 lb/day).
- A question that gave away another (149 stated that Giardia and Cryptosporidium are protozoa, which answered 166). 149 was reworded.
- Explanations that overclaimed or were wrong, softened or corrected (for example 003, 025, 036, 041, 064, 087, 089, 127, 129, 137, 143, 155, 164, 181, 184).
- Four pairs of duplicate questions; the later of each pair was rewritten to test a different point (115, 135, 078, 085, and 200).
- Calculation stems that did not say what a percent referred to or whether a dose was product or active chemical (216, 237, 249, 250, 257, 272, 278, 279).
- Wrong options that were silly or padded, and impossible wrong values in 15 calculations (such as 0.0 g/L), replaced with values built from real mistakes.

A second pass by GPT-6.1 Sol and Gemini hydrogen on the 72 changed questions found a few more points, and eight were fixed in a last round (278, 064, 036, 137, 149, 003, 082, 195). **The final wording of those eight was not reviewed again.**

## Left as it is

GPT-6.1 Sol's second pass also called some wrong options "weak" in questions that were already rewritten once (for example 048, 180, 199, 206). Each round found smaller issues, so iteration stopped there. Some wrong options may still be easier to rule out than ideal. The explanation sentence the bank builder adds to every calculation question ("Round only the final result...") is template text and was not changed.

## What this review does not cover

- **The dossier's required comparison with the existing US Class I water treatment package was not done.** The package is not in this repository, and the owner waived the same comparison for California water distribution. If overlap matters later, a comparison can still be run.
- The questions are original and written from an outline; they have not been compared with real exam questions. The Expected Range of Knowledge is dated 4/2020; the State Water Board may have updated it.
- No exact regulatory limit, MCL value, residual or turbidity limit, holding time, sample count or deadline appears in the bank, because none could be verified against the current rules. The one MCL-reading question uses a made-up value labelled hypothetical.
- No question has been imported, activated or shown to learners.
