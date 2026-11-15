# Spot-check round 3: Class 4 and the western courses

Reviewed 2026-11-15 by Claude Opus 5.5 (AI review, not a field review).

## What was sampled

| File | Items | Drawn from |
|---|---:|---|
| `r3-class4.csv` | 100 | Live Class 4 items on `main` at `c5e8ba56`, all four systems, seed `20261215`. Leaves out every prompt from rounds 1 and 2 and the items already queued for replacement. |
| `r3-western-only.csv` | 91 | The tables written only for the western (WPI) courses: the `*-g1.ts` gap tables and the `*-w1.ts` top-ups. These are not live yet, so `item_id` is the draft ID. Seed `20261216`. |

Most western rows are copies of the Ontario tables, so rounds 1 to 3 already cover them. That is why this sample takes only the western-only rows. The draw found 91 unique prompts against a quota of 100, because the smaller modes ran out of fresh prompts.

## Result

| File | OK | Unclear | Wrong | Weighted rate |
|---|---:|---:|---:|---:|
| Class 4 | 98 | 2 | 0 | 1.0% |
| Western-only | 90 | 0 | 1 | 1.1% |

The weighted rate counts an unclear item as half. Both files fall under the 2% threshold in the README.

## What was wrong or unclear

- **R3-CLASS4-062 (unclear).** A pump power board used "Racking" for frequent pump starts and stops. It is a rare glossary term, and exams use "short cycling".
  - Renamed in all 8 copies, across Classes 1 to 4 and the western copies.
  - The matching cause-and-effect explanation now reads "Short cycling, also called racking".
- **R3-CLASS4-090 (unclear).** The main repair sequence put "Flush the repaired section" before "Backfill and compact". Practice differs between utilities, so the order is arguable.
  - The step is now "Check the repair for leaks under pressure", which always comes before backfill.
  - Fixed in all 8 copies.
- **WPI-038 (wrong).** The keyed flaw was "Contact lists are updated after a major event". That is good practice, not a wrong statement.
  - Changed to "Contact lists wait for a crisis to be checked".
  - Only one copy exists, in `wpi-class4-wastewater-g1.ts`.

All 17 changed tables pass `check-draft.ts`.

## Live items affected

The two Class 4 fixes change rows that are live in all four Ontario distribution courses. That adds 24 live items, 6 in each of Classes 1 to 4 water distribution, to `docs/spot-check/live-items-to-replace-20261115.json`, which now lists 331 items. The western fix touches nothing live.

## Across all three rounds

| Round | Items | Wrong | Unclear | Weighted rate |
|---|---:|---:|---:|---:|
| 1 | 500 | 3 | 14 | 2.0% |
| 2 | 300 | 2 | 7 | 1.8% |
| 3 | 191 | 1 | 2 | 1.0% |

The rate is falling because each round's fixes were swept across the whole bank. This is still AI review. A field review by a certified operator is the remaining independent check.
