# Exam bank review: progress

Review of the production `questions` table, using the read-only export in `docs/exam-bank-export/2026-11-16/` (commit `d118897a`, 24,350 rows in 39 banks). Method as in `docs/exam-bank-review-plan.md`. Nothing here changes the database; Manus applies any change.

## Status (in progress)

`corrections.json` holds every problem found so far, with the bank, question number, original question, reviewer note and a full corrected question. Its header gives the chunks finished and the questions reviewed.

- The export was cut into 174 chunks of about 150 questions, in bank order.
- Each chunk had two planted wrong questions to prove the reviewer read it. From chunk 13 on, one of the two is subtle: a real calculation question from the same chunk with the key and final step quietly changed. **Every planted error so far was caught.**
- A second, stricter reviewer re-read one chunk that had no problems (chunk 7) and found the same result. The low problem rate in the newer banks is real, not skimming.
- Since 2026-11-16 the review runs one reviewer at a time, at the owner's request, to limit usage.

## What has been found so far

Problems cluster in the older banks. The `class1` bank (250 questions) and `class2-wastewater` have far more problems than the rest: Ontario rules described wrongly, US federal rules (EPA, OSHA, Class A/B biosolids) presented as the rule in Ontario, and wrong arithmetic. The newer banks run at about 0 to 2 problems per 150 questions.

Verdicts: `WRONG` (fact or key wrong), `UNCLEAR` (two defensible answers, or a claim that could not be confirmed), `JURISDICTION` (another place's rule), `UNITS` (US units in a Canadian bank).

## Notes for whoever continues

- The working files (chunks, planted-error list, scripts) are in the session scratchpad, not the repo, so the planted errors stay hidden from reviewers. The method can be rebuilt from this note and the plan.
- Reviewer corrections have not yet had a second check. Before Manus applies them, the `WRONG` and `JURISDICTION` fixes should be spot-checked.
