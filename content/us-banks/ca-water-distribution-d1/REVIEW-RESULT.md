# Review result: California Water Distribution Operator, Grade D1 bank

Reviewed 2026-11-16 by Opus, Gemini 4 hydrogen and GPT-6.1 Sol (the owner's verification authority for this content is review by Claude models; the other two were added at the owner's request).

## How the bank was built

The owner supplied the State Water Board's **Expected Range of Knowledge for the Drinking Water Distribution Exam (Rev. 4/2020)**. The bank follows its D1 question counts by content category, scaled from 100 to 250: disinfection 38, distribution system design and hydraulics 50, equipment operation, maintenance and inspections 50, drinking water regulations, management and safety 37, water mains and piping 50, water quality and water source 25. Only objectives labelled D1 to D5 were used; objectives labelled D2 and above were left out, as the dossier requires. Writers worked one batch at a time and wrote original questions from the objective list. The bank has 250 questions: 180 conceptual and 70 calculations.

After the fixes below, six pressure and volume calculations (originally filed under "regulations, management and safety") were moved to the "Distribution system design and hydraulics" module, so that module has 56 questions and the regulations module has 31, not the planned 50 and 37.

## The review

All 250 questions were read in two halves of 125 by Opus (one reviewer per half), by GPT-6.1 Sol and by Gemini 4 hydrogen. Each half held two planted errors: a wrong answer key, and a changed word or number in an explanation. **All three reviewers caught all four (4 of 4).** The reviewers checked each key, whether a wrong option could also be right, each explanation, every calculation redone from the question's stated constants, giveaway wording, and scope against the D1 objective list and the dossier's exclusions.

**Real problems found and corrected (82 questions in the first round):**
- Four questions had two wrong options that said almost the same thing (CA-D1-DIST-007, 008, 013, 018).
- About 50 questions had wrong options that were silly, padded, or obviously out of place, so the answer could be guessed by elimination; and a number of calculation questions had absurd wrong values (such as 0 ft). These were replaced with plausible mistakes (wrong conversion, missing constant, inverted ratio).
- Ambiguous or overclaiming wording was fixed in several questions, for example holding times (157), the lead and copper stagnation sample (150, 151), the sample siting and notification wording (165), lockout (176, 177), confined-space definition (178), the backfill volume (219) and the hydraulic grade question (247).
- A second pass by GPT-6.1 Sol and Gemini hydrogen on the changed questions found two explanations that still described options replaced during the rewrite (163, 177) and several more options that stood out by wording (007, 014, 021, 043, 089, 122, 135, 139, 151). These 11 were fixed. **The final wording of these 11 was not reviewed again.**

## Left as it is

GPT-6.1 Sol's second pass also raised a number of points about wrong options being "weak" or "implausible" in questions that were already rewritten once. Each round of review found smaller issues, so iteration stopped here. Some wrong options in this bank may still be easier to rule out than ideal. The explanation text added to every calculation question by the bank builder ("Round only the final result...") is template text and was not changed.

## What this review does not cover

- **The dossier's required comparison with the existing US Class I water distribution package (198 questions) was not done.** The package is not in this repository and the owner chose to waive the comparison and build this bank from the official D1 outline. If any overlap matters later, a comparison can still be run.
- The questions are original and written from an outline; they have not been compared with real exam questions. The Expected Range of Knowledge is dated 4/2020; the State Water Board may have updated it.
- No exact regulatory limits, sample counts, deadlines or notification wording appear in the bank, because they could not be verified against the current rules.
- No question has been imported, activated or shown to learners.
