# US exam-bank queue

Written 2026-11-16. The owner's direction: set up the exam bank for every state's exam with **250 questions each**, and add more questions once learners in those states are buying. The Pennsylvania water distribution bank stays at 500.

## Rules for this queue

- A bank is written only for a route whose dossier says it can be verified. The dossier fixes the exam, the objectives and the exclusions. See `docs/us-launch/US_STATE_QUESTION_BANK_READINESS_2026-10-29.md`.
- **Suitable** routes get a full 250. **Narrow** routes have only part of the exam verified, so the bank covers only what the dossier supports. It may be smaller than 250, and the limit is recorded in the bank's config and in its review result.
- **Hold** and **Defer** routes get no bank until the research behind them is redone.
- Each bank follows the same steps: a writer in batches, one at a time; the full build check; an Opus review with planted errors; corrections applied; committed. Writer brief: `docs/us-launch/US_BANK_WRITER_BRIEF.md`.
- Banks are ordered by the number of operators in the state (May 2025 federal figures, see `US_STATE_PRIORITY_2026-11-16.md`), and within a state Suitable routes come first.
- States with their own exam and no dossier yet (for example Texas, New York, Ohio, Georgia, Virginia, Arizona, Tennessee, Missouri) need a dossier first. That work needs the state's official exam pages, and this session can reach only a short list of sites, so it needs the other session or a wider network allowlist.

## Routes ready to write (41)

| # | State | Operators | Stream | Dossier | Status |
|---:|---|---:|---|---|---|
| 1 | California | 11,630 | wastewater-collection | Suitable | Queued |
| 2 | California | 11,630 | water-distribution | Suitable | Queued |
| 3 | California | 11,630 | water-treatment | Narrow | Queued |
| 4 | Florida | 7,440 | water-distribution | Narrow | Queued |
| 5 | Florida | 7,440 | water-treatment | Narrow | Queued |
| 6 | Pennsylvania | 4,660 | wastewater-collection | Suitable | In progress: 250 questions, batch 2 of 4 |
| 7 | Pennsylvania | 4,660 | water-distribution | Suitable | Done: 500 questions, reviewed |
| 8 | Pennsylvania | 4,660 | wastewater-treatment | Narrow | Queued |
| 9 | Pennsylvania | 4,660 | water-treatment | Narrow | Queued |
| 10 | North Carolina | 3,620 | water-distribution | Narrow | Queued |
| 11 | North Carolina | 3,620 | water-treatment | Narrow | Queued |
| 12 | Illinois | 3,500 | water-distribution | Narrow | Queued |
| 13 | Illinois | 3,500 | water-treatment | Narrow | Queued |
| 14 | Michigan | 3,400 | wastewater-treatment | Narrow | Queued |
| 15 | Michigan | 3,400 | water-distribution | Narrow | Queued |
| 16 | Michigan | 3,400 | water-treatment | Narrow | Queued |
| 17 | Indiana | 3,140 | water-distribution | Narrow | Queued |
| 18 | Indiana | 3,140 | water-treatment | Narrow | Queued |
| 19 | Kentucky | 2,540 | water-distribution | Narrow | Queued |
| 20 | Louisiana | 2,450 | water-distribution | Suitable | Queued |
| 21 | Louisiana | 2,450 | water-treatment | Narrow | Queued |
| 22 | Oklahoma | 2,280 | water-distribution | Narrow | Queued |
| 23 | Wisconsin | 2,230 | wastewater-collection | Suitable | Queued |
| 24 | Wisconsin | 2,230 | wastewater-treatment | Suitable | Queued |
| 25 | Wisconsin | 2,230 | water-distribution | Narrow | Queued |
| 26 | Wisconsin | 2,230 | water-treatment | Narrow | Queued |
| 27 | New Mexico | 2,110 | wastewater-collection | Suitable | Queued |
| 28 | New Mexico | 2,110 | wastewater-treatment | Suitable | Queued |
| 29 | New Mexico | 2,110 | water-distribution | Suitable | Queued |
| 30 | New Mexico | 2,110 | water-treatment | Suitable | Queued |
| 31 | Utah | 1,900 | water-distribution | Suitable | Queued |
| 32 | Utah | 1,900 | water-treatment | Narrow | Queued |
| 33 | Kansas | 1,560 | wastewater-treatment | Narrow | Queued |
| 34 | Mississippi | 1,150 | water-distribution | Narrow | Queued |
| 35 | Connecticut | 980 | wastewater-collection | Narrow | Queued |
| 36 | North Dakota | 550 | water-distribution | Suitable | Queued |
| 37 | North Dakota | 550 | water-treatment | Narrow | Queued |
| 38 | New Hampshire | 510 | wastewater-collection | Suitable | Queued |
| 39 | New Hampshire | 510 | wastewater-treatment | Narrow | Queued |
| 40 | Delaware | 340 | water-treatment | Narrow | Queued |
| 41 | Vermont | 320 | water-distribution | Narrow | Queued |

## Routes on hold or deferred (12)

| State | Stream | Dossier |
|---|---|---|
| Kentucky | water-treatment | Hold |
| Minnesota | water-distribution | Hold |
| Minnesota | water-treatment | Defer |
| Oklahoma | water-treatment | Defer |
| Maryland | water-treatment | Defer |
| Kansas | water-treatment | Defer |
| Mississippi | water-treatment | Defer |
| Nebraska | wastewater-treatment | Defer |
| Nebraska | water-distribution | Hold |
| Nebraska | water-treatment | Defer |
| Delaware | wastewater-treatment | Defer |
| Delaware | water-distribution | Hold |
