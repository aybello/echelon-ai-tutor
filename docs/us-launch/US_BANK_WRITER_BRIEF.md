# Writer brief: US state exam banks

For anyone, human or model, writing a state exam bank under `content/us-banks/<bank-id>/`. Read the state's dossier first (`docs/us-launch/state-dossiers/`). The dossier fixes the exam, the objectives and the exclusions. This brief covers the writing.

## What you are writing

Original multiple-choice practice questions for one state exam, in US customary units (gpm, psi, ft, gal, MGD, lb/day, mg/L). Each question has one correct answer and three wrong options. A bank has 250 questions at first release, about 70% conceptual and 30% calculation. The size is set in the bank's `config.json`. More questions are added later. Nothing here is imported, activated or shown to learners. The questions are drafts for review.

## Files

You write plain text into two files in `content/us-banks/<bank-id>/source/`. **Append to them. Do not change lines another writer made.** Lines starting with `#` and blank lines are ignored.

`conceptual.txt`. A section header, then rows under it:

```
@Module name|SOURCE|Topic name
Question text|Correct answer|Wrong 1|Wrong 2|Wrong 3|Explanation|level
```

`calculations.txt`. A section header, then rows:

```
@Module name|SOURCE|Topic name
Question text with every assumption stated|Formula in words|expression|unit|decimal places|wrong1,wrong2,wrong3|level
```

- `SOURCE` is a key from the bank's `config.json`. Use the key that best supports the topic.
- `level` is `e`, `m` or `h`. Conceptual rows default to `e` if you leave it out. Calculation rows default to `m`.
- The `expression` is numbers and `+ - * / ( )` only. The builder computes the correct answer from it. Give the wrong values as plain numbers with no units and no thousands separators. The builder formats them the same way as the answer.
- Never use the `|` character inside a field.

## Adding questions later

Append new rows at the end of the source files and raise `count` and `calcCount` in `config.json`. **Never insert, reorder or delete a row in a bank that has been reviewed or imported**: question numbers and answer positions follow the order of the rows, and the builder keeps existing ones unchanged only if the earlier rows stay where they are. Each new batch still needs a review.

## Checking your work

Run this after each section and fix every problem it lists:

```
node scripts/us-bank.mjs lint <bank-id>
```

The checker finds the same problems the final review will: duplicate questions, duplicate options, a correct answer that is much longer or shorter than the wrong ones, giveaway words, a bad calculation. When all the batches are in, `node scripts/us-bank.mjs build <bank-id>` shuffles the answer positions and writes the package.

## Rules for the questions

1. **Stay inside the dossier.** Use only its objectives. Do not write anything its exclusions rule out. For Pennsylvania water distribution that means: no Part I General Examination or treatment content, no exact regulatory limits or reporting deadlines, no state code citations, no site-specific procedures, no worksite safety instructions, no emergency response steps.
2. **True and unambiguous.** One answer is right, and an operator would agree. If a statement depends on a local rule or on practice that varies, leave it out.
3. **Plausible wrong options.** Each wrong option should be something a learner could believe from a common misunderstanding. No joke options, no "all of the above", no "none of the above", no "both A and B".
4. **No giveaways.** Do not make the correct answer the longest or the shortest option every time. Do not use *always, never, only, all, every, none, cannot, completely, entirely, solely* in options. Vary where the right answer sits in your own head; the builder shuffles positions.
5. **Write the stem so the answer is not in it.** Do not repeat a distinctive word from the correct answer in the question.
6. **Calculations.** State every assumption and constant in the question (for example, "Use 8.34 lb/gal" or "1 ft³ = 7.48 gal"). Make the wrong values the results of real mistakes: a wrong conversion, a missed step, using the diameter as the radius, an inverted ratio. Never use a wrong value that equals the correct answer. Round only the final answer.
7. **Mix.** Conceptual rows should be about 30% easy, 55% medium and 15% hard. Calculation rows about 60% medium and 40% hard. Hard means more than one step, or a judgement between two reasonable actions.
8. **Original wording.** Write in your own words. Do not copy sentences from the manuals, from past exams, or from other banks in this repository. Check that you are not repeating a question that is already in the files.
9. **Explanation.** One to three sentences saying why the answer is right and, where useful, what the common wrong idea gets wrong. For conceptual rows, at least 25 characters.
10. **Cover the topic list evenly.** Write 8 to 12 questions per topic, and spread difficulty inside each topic.

## Units and constants (US)

1 ft of water = 0.433 psi; 1 psi = 2.31 ft of water; 1 ft³ = 7.48 gal; 1 gal of water = 8.34 lb; 1 MGD = 694.4 gpm = 1.547 cfs; 1 acre-ft = 43,560 ft³; water horsepower = flow (gpm) × head (ft) ÷ 3,960; volume of a cylinder in gallons = 0.785 × D² × H × 7.48 (D and H in ft); flow = area × velocity; dose (lb/day) = flow (MGD) × concentration (mg/L) × 8.34. State any constant you use in the question.
