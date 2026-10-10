# Class 1 Water Treatment — replacement question set

500 draft questions for the `class1-water` bank, written to replace items carrying
an answer-length tell. See `server/answerLengthBias.ts` for the bias these were
written to avoid, and `scripts/audit-answer-length-bias.ts` to measure the live bank.

## Status: DRAFT — not cleared for learners

Every question is `reviewStatus: "in_review"` and must pass SME technical review
before it reaches a learner. Nothing here has been verified by a certified
water operator or subject matter expert.

## Why these are safe to review but not to publish unread

Two rules were applied while writing:

1. **No regulatory numeric limits, deadlines or code citations are asserted.**
   Regulatory topics are framed conceptually ("a health-based limit", "the
   required notification"). An AI-authored item that states a specific
   concentration limit or a reporting deadline would be a plausible-sounding
   guess, and that is the failure mode most likely to reach a learner unnoticed.
2. **Every calculation is self-contained.** All values needed appear in the
   question stem, so the arithmetic can be checked independently without
   reference to any external table.

Reviewers should still confirm process facts, terminology and Ontario relevance.

## Composition

| Property | Value |
|---|---|
| Questions | 500 (`questionNum` 1001–1500) |
| Modules | 16 |
| Calculations | 112 (22%), all with worked steps |
| Distinct topics | 484 |
| Difficulty | 46 easy / 313 medium / 141 hard |
| Answer positions | 125 / 125 / 125 / 125 |
| Correct option is longest | 34% (existing bank sample: 76%; chance: 25%) |
| Exploitable length tells | 6 of 500 (1%) |

## Import requirements

Files use the `questions` table field names directly (`questionNum`, `module`,
`options`, `correctIndex`, `explanation`, `steps`, `tip`, `isCalc`, `topic`,
`difficulty`). Before import:

- **Deduplicate against the live bank.** These were written against the 25
  questions visible in `client/src/lib/seedQuestions.ts`, not the full DB bank.
- **Insert as `reviewStatus = 'in_review'`**, matching the convention `scripts/fix-answer-length-bias.ts` uses for machine-authored content, so they enter the staged review queue rather than being indistinguishable from never-reviewed legacy items.
- **Bump `questionBankMeta.contentVersion`** for `class1-water` so client caches
  invalidate.
- **Renumber if 1001–1500 collides** with existing `questionNum` values.

After import, verify the bank with:

```
pnpm audit:answer-bias -- --bank class1-water
```
