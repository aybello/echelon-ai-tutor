# Plan and reviewer brief: review of the exam question banks

For the session that carries out the review. Read `docs/HANDOFF-continue-building.md` first and keep its ground rules. The earlier review of the game content is the model for this one: `docs/spot-check/full-review/RESULTS-full-review.md`, and the tools in `scripts/game-authoring/full-review/`.

## Goal

Read every multiple-choice exam question and find the ones that are wrong, unclear, use US units in a Canadian bank, or apply the wrong jurisdiction's rules. Produce corrections. Do **not** write to the database and do **not** change a question file that carries a review receipt or hash.

## Where the questions are

About 5,100 rows in 34 files under `content/`. Some are drafts or revisions of each other, so remove duplicates before reviewing.

| Folder | What it holds |
|---|---|
| `content/class1-treatment/questions/` | Class 1 water and wastewater treatment, 250 each |
| `content/class1-networks/questions/` | Class 1 collection and distribution, 250 each |
| `content/class1-water/questions/` | Class 1 water, 13 batches of 40 |
| `content/class2-2026-09-23/` | Class 2, four systems, 250 each (drafts) |
| `content/class3-water-dist/` | Class 3 distribution: candidates, revisions and repaired sets |
| `content/wpi-class3-water-dist/` | Western Class 3 distribution, 209 repaired |
| `content/oit/questions/` | OIT water and wastewater, about 490 each |
| `content/us-texas-class-d-water/` | Texas Class D water, 120 |
| `content/309a/questions/` | The 309A set (an electrician exam, not water). Review it last, and only for correctness |
| `server/seeds/examBankGapQuestions.ts` | Gap-fill questions for Class 1 collection and distribution |

Files differ in shape. Look at each one before you chunk it. The production table is `questions`; its columns are in `EXAM_BANK_GAP_SPEC.md`: `question`, four `options`, `correctIndex`, `explanation`, optional `steps` for calculations, `module`, `difficulty`, `isCalc`.

A read-only export of the production table has been requested from Manus. If it has arrived, review that as well, and compare it with the repo files so you only read what is new or changed.

## Before you edit anything

Read `content/oit/README.md`, `server/questionGovernance.ts` and `server/questionApproval.ts`. Some files carry hashes or approval records that a text edit would break. **Do not edit the question files.** Write corrections to a separate file (below) and let Manus apply them.

## How to run it

1. Load each file, drop exact duplicates and superseded drafts, and give every question a stable id made of the file name and its number.
2. Cut the questions into chunks of 150. Questions are longer than game items, so use smaller chunks.
3. Plant known errors in each chunk to prove a reviewer is reading (see `scripts/game-authoring/full-review/canary.py`). Use questions with a wrong answer key, such as chlorine gas raising pH, CT as concentration times flow, a bacterium listed as a protozoan, or hydrogen sulfide lighter than air.
4. Send chunks to reviewers in waves of at most six. A larger wave hit the usage limit and lost work.
5. Check that every planted error was caught. If one was missed, send that chunk again.
6. Merge the results into the corrections file and write a results note.

## Brief to give each reviewer

You are verifying exam questions for water and wastewater operator certification in Ontario, western Canada and the US. Be a strict subject-matter expert. Use WebSearch or WebFetch to check anything you cannot settle from knowledge: AWWA and WEF manuals, Sacramento State OWP manuals, EPA, Health Canada, MECP Ontario (O. Reg. 170/03 and the operator licensing pages), and the ABC Need to Know guides on `owwco.ca`. If you cannot confirm a doubtful claim, mark it UNCLEAR with the reason. Do not edit any repository file; write only your output file.

For each question check:

- The marked answer is correct and no other option is also correct.
- The three wrong options are clearly wrong. A wrong option that is also defensible makes the question unfair.
- The explanation is correct and matches the answer.
- For calculation questions, redo the arithmetic and check that the steps lead to the marked answer.
- The question has one defensible reading and does not depend on a local rule that it does not state.
- Units are metric in any Canadian question. US units are fine in `us-*` banks.
- A statement of a rule is correct for the jurisdiction named. An Ontario regulation number in a western or US question is a problem.

Verdicts: `WRONG` (factually wrong or the key is wrong), `UNCLEAR` (two answers defensible, misleading wording, local rule, or a claim you could not verify), `UNITS`, `JURISDICTION`, `OFF-TOPIC`. Do not flag style or difficulty, and do not flag correct questions. Expect about 1 to 5 percent to have a problem, but read every one.

Write one JSON line per problem question:

```
{"id":"<file>#<number>","verdict":"WRONG","note":"what is wrong and the correct fact, with the source if you checked one","fix":{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"...","steps":null}}
```

`fix` is a full corrected question in the same shape. Set `"fix": null` if it cannot be repaired. Finish with `{"done":true,"reviewed":<n>,"problems":<n>,"searches":<n>}`.

## What to produce

- `docs/exam-bank-review/corrections.json`: every problem with its id, verdict, note and corrected question.
- `docs/exam-bank-review/RESULTS.md`: how many questions were read, the problem rate by bank, the planted-error check, the most serious wrong answers, and what the review did not cover.
- A new section in `docs/manus-request-western-release-and-fixes-20261115.md` telling Manus which questions to change in the `questions` table, by bank and question number, and where `corrections.json` is.

Commit those by name and push to `claude/hello-5oz7m4`.
