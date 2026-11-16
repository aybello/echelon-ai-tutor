# Review result: Pennsylvania Class E water distribution bank

Reviewed 2026-11-16 by Opus reviewers (Claude models), the owner's verification authority for this content.

## What was done

All 500 questions were read in four chunks of 125. Each chunk also held two deliberately planted errors, to show that the reviewer was reading. The reviewers checked each key, whether a wrong option could also be right, each explanation, each calculation redone from the question's own constants, and the dossier's scope exclusions.

## Result

- **Planted errors caught: 8 of 8.**
- **Real problems: 3 of 500 (0.6%).** All three were UNCLEAR, none WRONG, and each came with a corrected question:
  - PA-E-DIST-037, altitude valve: the explanation presented a two-way valve's behaviour as universal. Reworded to say some valves are two-way and others are not.
  - PA-E-DIST-181, pump trip: one wrong option ("Lower velocity upstream") was defensible. Replaced the distractors.
  - PA-E-DIST-253, ice in tanks: a wrong option ("It reduces the volume that the tank can hold") was arguably correct. Replaced it.
- The three fixes are applied in `source/conceptual.txt` and the package is rebuilt (500 questions, 125 answers in each position, no answer-cue flags).

## What this review does not cover

- The reviewers made no web checks in this review. They judged from knowledge, with each calculation recomputed. The earlier writers' flagged questions (WRITER-FLAGS.md) were reviewed like any other and none was marked wrong.
- The Pennsylvania DEP Module 8 manual that the exam is built on could not be reached from the review environment, so the questions are not checked against it line by line.
- No question here has been imported, activated or shown to learners.
