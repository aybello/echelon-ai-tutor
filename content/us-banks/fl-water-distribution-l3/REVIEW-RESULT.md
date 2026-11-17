# Review result: Florida Water Distribution System Operator, Level 3 bank

Reviewed 2026-11-17 by two Opus reviewers (one per half), Gemini 4 hydrogen and GPT-6.1 Sol. The owner's verification authority for this content is review by Claude models; the other two were added at the owner's request.

## How the bank was built

The Florida DEP publishes only the subject-area headings for the Level 3 distribution exam (disinfection, system design, install, maintain and operate equipment, system inspection, water quality, administrative duties, drinking water regulations, safety and security). It gives **no weights and no learning objectives**, so this bank is written at general entry-level depth and is narrower than the 250-question banks. Writers worked in four batches and wrote original questions. The bank has 150 questions: 114 conceptual and 36 calculations. Module sizes follow the batches, not any published weights.

The DEP's own documents disagree on whether "Evaluate operation of equipment" is a content area, so that heading was not given its own module.

## The review

All 150 questions were read in two halves of 75 by Opus (one reviewer per half), GPT-6.1 Sol and Gemini 4 hydrogen. Each half held two planted errors: a wrong answer key and an altered explanation (a word in half 1, a number in half 2). **All four reviewers caught all four planted errors (4 of 4 each).** Reviewers checked each key, whether a wrong option could also be right, each explanation, every calculation redone from the stated constants, giveaway wording, and scope against the dossier's exclusions.

**Real problems found and corrected:**
- Three questions had two wrong options that said almost the same thing (050, 067, 070). Opus and Gemini and GPT all flagged them.
- Question 025 had a wrong option (main valve left partly open) that a practising operator could defend as a cause of a full barrel (flagged by Opus and GPT). Replaced with a clearly wrong option.
- Question 096 had its correct option as the longest and only wordy option; shortened. Its explanation said plant disinfection "does not guard" against later contamination, which GPT noted is too absolute; reworded.
- Questions 119 and 120 used a treatment plant and a clearwell, which are outside distribution scope; reworded to a pumping station and a storage tank.
- Question 141 was a thrust-block sizing calculation using soil bearing pressure and a design safety factor. That is engineering design, which the dossier excludes. GPT flagged it; replaced with a storage-tank volume calculation (answer 187,898 gal, rechecked).
- Explanations that overclaimed were corrected: 024 (flushing and velocity), 041 (hydrant drain closes as the valve opens and can stay open at small openings), 062 (backflow assemblies "sit idle"), 102 (protective systems hold soil back or shield workers), 103 (ladder is an exit, not cave-in protection), 106 (a hazardous chlorine amount can be present without visible color) and 135 (the verbal demand formula now matches the arithmetic).

## Left as it is

- GPT-6.1 Sol listed about 20 more questions where the wrong options are "implausible" or "conspicuous" (for example 008, 009, 031, 033, 049, 052, 066, 071, 078, 081 to 084, 086, 088, 092, 100, 105, 110, 111, 113). These are the same kind of weak-distractor note raised in the California reviews. They were not rewritten; some wrong options in this bank may be easier to rule out than ideal. Opus and Gemini did not raise them.
- GPT also asked for tighter wording in several questions (003, 004, 016, 023, 037, 061, 085, 099, 104, 117). These are fine-print points that would make entry-level questions harder to read, so they were left.
- Question 001 and question 096 cover the same concept (why a residual is kept in the distribution system) and both have the same correct answer. They are separate modules and were left, but one could be dropped later.
- The topic header of the replaced calculation row still reads "Trench volume, quantities and thrust blocks".
- The explanation text added to every calculation question by the bank builder ("Round only the final result...") is template text and was not changed.
- The fixed questions were not reviewed a second time.

## What this review does not cover

- The dossier's required comparison with the existing US package was not done for this bank. The owner waived that comparison for the California banks, and it was not run here either. If any overlap matters later, a comparison can still be run.
- The questions are original and written from headings only; they have not been compared with real exam questions, and no official objectives exist to map them to.
- Each reviewer was told to redo the calculations; it is not known whether the Opus reviewers ran code or worked the arithmetic by hand (each used only a few tool calls). The calculation answers were also checked by script when the bank was written, and the replacement for question 141 was rechecked.
- No exact regulatory limits, sample counts, deadlines or rule numbers appear in the bank.
- No question has been imported, activated or shown to learners.
