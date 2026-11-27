# Review result: Pennsylvania wastewater treatment, Part I General Examination component

Reviewed 2026-11-27. Queue entry 8 (pa-wastewater-treatment, dossier verdict Narrow). Scope: the common Part I General Examination only. This is not preparation for any Part II, master, collection or laboratory-supervisor examination, and it is not a certificate.

## Counts

- 122 questions: 93 conceptual, 29 calculations.
- Conceptual difficulty: 29 easy, 51 medium, 13 hard (31% / 55% / 14%).
- Calculation difficulty: 18 medium, 11 hard (62% / 38%).
- Modules: Treatment fundamentals 24 (Module 1 and 4 topics), Disinfection and chlorination 18, Solids handling and disposal 15, Pumps, hydraulics and maintenance 10, Laboratory and administration 8, Chemical feed systems 7, Flow measurement 6, General chemistry 5, Basic math 29.
- Size reason: the dossier supports only the common Part I component and only four high-level objective areas. The 122 figure is the writer's sizing decision, not a DEP number. See `config.json` (`scopeDecision`).

## Reviewers

- **gpt-6.2-sol** (OpenAI, through the agent proxy). Round 1 read all 122 items in five chunks, with planted errors. Round 2 read the corrected bank with no planted errors.
- **Writer and adjudicator: Claude Haiku 5.5.** The same model wrote the items and made every decision on the flags. This is not an independent review.
- Not used: Opus (not available in this session) and Gemini (not available in this environment).

## Chunks and planted errors

Chunks by question number: 1-25, 26-50, 51-75, 76-100, 101-122 (25, 25, 25, 25, 22). Each chunk held two planted errors in the review copy only, never in the source: one wrong answer key, and one changed fact or number in an explanation. Conceptual chunks had no numbers to change, so their planted explanation change was a swapped word (for example "sludge" for "liquid").

- **Planted errors caught: 10 of 10 (100%).** These planted errors were deliberately easy to see. The result does not show that the reviewer would catch subtler real errors.

## Round 1: flags on items that were not planted

GPT flagged 41 items that were not planted. Writer decisions:

- **Fixed: 34.** Examples: answer-giving stems (questions 3, 60, 48), an explanation that overstated a rule (54, 56, 93), an imprecise definition (19, 28, 36, 39, 77), a missing assumption or rounding rule (98, 108, 110, 113, 117, 119, 116), a unit error (121, gal changed to gal/day), and implausible distractors (77, 80, 81, 83, 86, 87, 88, 92).
- **Not a real problem: 3** (7, 12, 23).
- **Left unchanged after judgment: 4** (14, 31, 40, 50). Question 50 follows the textbook convention that volatile solids are organic solids, and question 14 describes a test result that is a dry mass, not a concentration.

A metadata error was also found and fixed: disinfection and solids rows had been filed under the Module 1 header. Question numbers did not change.

## Round 2: flags on the corrected bank

GPT flagged 31 items on the corrected bank. The writer applied fixes to 15 (questions 9, 19, 33, 37, 39, 46, 55, 56, 67, 68, 72, 87, 93, 116, 119). The other 16 were left unchanged. Some were nits, some were GPT misreadings (41, 75), and some were partly valid (48, 61, 76). Those are recorded here so the owner can decide. Question numbers: 2, 7, 10, 12, 14, 23, 29, 31, 32, 40, 41, 48, 50, 61, 75, 76.

## Automated checks

- `node scripts/us-bank.mjs build` and `check` both passed.
- Calculations recomputed with `python3 -I`: all 29 match the stored answers.
- Answer positions: A 31, B 30, C 30, D 31.
- Longest-option share 29.0% (limit 35%). Shortest-option share 32.3% (limit 35%).

## Limits

- Single writer. The same model wrote the items and adjudicated the review. Opus was not used.
- Gemini was not available.
- No comparison with real Pennsylvania exam questions.
- Not checked line by line against the DEP module PDFs. Only the public DEP module index and the 2024 Part I/Part II reference list were read. Topic coverage follows those pages.
- Scope exclusions: safety (Module 30) and industrial pretreatment are left out. The dossier names both as Part I preparation areas. DEP's Part I list includes Module 30 but does not list pretreatment for Part I. Both exclusions are writer choices, and the owner needs to decide them.
- Governance: the readiness contract (2026-10-29) allows candidate batches only for Suitable dossiers, and the dossier says its Part I recommendation does not authorize authoring. This bank follows the owner's queue, which writes Narrow routes with a limit. The owner must confirm this before any import.
- Not imported, not published, not shown to learners.
