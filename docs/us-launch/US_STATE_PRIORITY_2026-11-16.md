# US states ranked by operator numbers and exam type

Written 2026-11-16. This is the first step of the US plan: find the large states that would benefit most, build their exam banks, then their games.

## What was used

- **Operator counts:** the federal Occupational Employment and Wage Statistics for May 2025, state file, occupation 51-8031 (Water and Wastewater Treatment Plant and System Operators). The file was supplied by the owner. Nevada is suppressed in the data, so it is left out of the shares. Puerto Rico and the Virgin Islands are in the file but are not ranked here.
- **Exam type per state and stream:** `shared/usExamResearch.ts` (official program evidence retrieved through 2026-10-11). It records whether a stream uses the national WPI exam, its own state exam, or is unverified.
- **Dossier verdicts:** `docs/us-launch/US_STATE_DOSSIER_DECISION_INDEX_2026-10-29.json`.

## The ranking (top 25)

| Rank | State | Operators (May 2025) | Share of US | Streams with their own exam | Streams on the national (WPI) exam | Streams unverified or mixed | Dossier verdicts (Suitable / Narrow) |
|---:|---|---:|---:|---:|---:|---:|---|
| 1 | California | 11,630 | 9.1% | 3 | 0 | 1 | 2 / 1 |
| 2 | Texas | 10,520 | 8.2% | 2 | 0 | 2 | none yet |
| 3 | Florida | 7,440 | 5.8% | 2 | 0 | 2 | 0 / 2 |
| 4 | Ohio | 5,870 | 4.6% | 0 | 2 | 2 | none yet |
| 5 | New York | 5,300 | 4.2% | 0 | 0 | 4 | none yet |
| 6 | Pennsylvania | 4,660 | 3.6% | 4 | 0 | 0 | 2 / 2 |
| 7 | Arizona | 3,950 | 3.1% | 0 | 4 | 0 | none yet |
| 8 | North Carolina | 3,620 | 2.8% | 2 | 0 | 2 | 0 / 2 |
| 9 | Illinois | 3,500 | 2.7% | 2 | 0 | 2 | 0 / 2 |
| 10 | Virginia | 3,460 | 2.7% | 0 | 2 | 2 | none yet |
| 11 | Michigan | 3,400 | 2.7% | 3 | 0 | 0 | 0 / 3 |
| 12 | Georgia | 3,310 | 2.6% | 0 | 2 | 2 | none yet |
| 13 | Indiana | 3,140 | 2.5% | 2 | 1 | 1 | 0 / 2 |
| 14 | Tennessee | 3,140 | 2.5% | 0 | 3 | 1 | none yet |
| 15 | Missouri | 3,000 | 2.3% | 0 | 0 | 4 | none yet |
| 16 | Alabama | 2,770 | 2.2% | 0 | 4 | 0 | none yet |
| 17 | South Carolina | 2,650 | 2.1% | 0 | 2 | 2 | none yet |
| 18 | Colorado | 2,620 | 2.1% | 0 | 0 | 4 | none yet |
| 19 | Kentucky | 2,540 | 2.0% | 2 | 0 | 2 | 0 / 1 |
| 20 | Massachusetts | 2,510 | 2.0% | 0 | 2 | 2 | none yet |
| 21 | New Jersey | 2,500 | 2.0% | 0 | 2 | 2 | none yet |
| 22 | Louisiana | 2,450 | 1.9% | 2 | 0 | 2 | 1 / 1 |
| 23 | Iowa | 2,370 | 1.9% | 0 | 0 | 4 | none yet |
| 24 | Minnesota | 2,290 | 1.8% | 2 | 0 | 2 | 0 / 0 |
| 25 | Oklahoma | 2,280 | 1.8% | 2 | 0 | 2 | 0 / 1 |

Shares are of 127,680 operators in the 49 states that the file reports (Nevada is suppressed, and the District of Columbia is not in the file). The top eleven states hold 50% of them.

## Recommendation

**Wave 1: the four biggest states that write their own exam.** California, Texas, Florida and Pennsylvania hold 34,250 operators (27%). Learners there cannot use national-exam prep, so a state-shaped bank has the clearest value.
- **California** is the largest state. Its water distribution and wastewater collection dossiers are rated Suitable, and water treatment is Narrow.
- **Pennsylvania** is the cleanest case: all four streams have their own exam, and two dossiers are rated Suitable.
- **Texas** is second in size. A game course exists (`us-texas-class-d-water`) but there is no dossier yet, so the first job there is verifying each exam outline from the state's official source.
- **Florida** is third in size. Both dossiers are Narrow, which means the verified scope is limited.

**Wave 2: four more states with their own exam.** North Carolina, Illinois, Michigan and Indiana hold 13,660 operators (11%). All four already have dossiers rated Narrow.

**A separate, cheaper track: large states on the national exam.** Ohio, Arizona, Virginia, Georgia and Tennessee hold 19,730 operators (15%) and use the national WPI exam for most streams. Our western courses already cover that exam. The catch is units: those courses are written in metric for Canada, and a US candidate sits the exam in US units. So this track needs US-unit editions of the existing content, plus a short state rules note, and not new banks.

**Needs research first: New York.** It is fifth in size, but all four of its streams are unverified, so there is no official exam source on record. Missouri, Colorado and Iowa are in the same position.

## Limits of this ranking

- It counts employed operators, not people sitting exams. Exam volume depends on turnover and on how many levels a state certifies, and no data on it was used.
- The occupation covers treatment plant and system operators. Collection and some distribution crews are partly counted under other occupations, so those streams are undercounted.
- A state with many operators is not necessarily a state where learners lack good prep. Competitor coverage has not been checked.
- Exam type comes from the October 2026 research. A state marked unverified may turn out to have its own exam.

## What happens next

1. The owner confirms or changes the two waves above.
2. For each wave-1 state, verify the exam outline for each stream and level from the official source, as `docs/us-launch/US_STATE_QUESTION_BANK_READINESS_2026-10-29.md` requires.
3. Write the exam bank (multiple-choice questions) for one state at a time, in US units, then run the full review used for the Canadian content.
4. Build the games for that state.
