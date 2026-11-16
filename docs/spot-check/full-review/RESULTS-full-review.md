# Full review of every game item

Done 2026-11-15 to 2026-11-16 by Claude models, at the owner's direction. The owner decided that review by Claude models, with web and textbook checks where needed, is the verification authority for this content. This replaces the earlier sampling.

## What was reviewed

Everything. The game content is built from authoring tables, and the same row is repeated across many courses. So each distinct piece of content was read once, and the result was applied to every copy.

| Group | Distinct units read |
|---|---:|
| Table rows: facts, boards, odd sets, sequences, relations, flaws | 9,341 |
| Live items that come from no table (the older base bank and a few overlay-only items) | 4,328 |
| **Total** | **13,669** |

These cover all 29,943 live items on `main` at `c5e8ba56` and every row in the 190 draft tables.

Each unit was read by an Opus 5.5 reviewer working from `INSTRUCTIONS.md` in the working copy. Reviewers used web search where a fact could not be settled from knowledge, 45 checks in total, mostly against Ontario regulation pages, AWWA and Sacramento State manuals, and the ABC Need to Know guides.

### Check on the reviewers

72 deliberate errors (wrong answers about chlorine gas and pH, CT, a bacterium listed as a protozoan, a reversed hydrogen sulfide statement, a backwash sequence out of order, a mismatched board) were planted among the work in 36 of the chunks. **All 72 were caught**, and each was corrected properly. That is the best evidence available that the reviewers read every item.

One gap was found afterwards. The first merge of identical items used a key that ignored options and pairs, so 74 distinct live items that shared a prompt with a reviewed item were not read. They were read in a final pass. Those were older base-bank items, and 31 of 74 had a problem.

## What was found

432 distinct units had a problem, about 3.2 percent.

| Verdict | Units | What it means |
|---|---:|---|
| WRONG | 17 | Factually wrong, or the answer key is wrong |
| UNCLEAR | 143 | Two answers defensible, a step order that could swap, a member or intruder that did not fit, or misleading wording |
| UNITS | 268 | US units in a Canadian course. Converted to metric with the answers recalculated |
| JURISDICTION | 4 | A US or Ontario rule used in the wrong place |

By kind: 288 were older base-bank items, 48 boards, 41 sequences, 23 flaws, 17 odd sets, 8 relations and 7 facts.

The authoring tables had 144 problems in 9,341 rows (1.5 percent). The older base bank had 288 in 4,328 items (6.7 percent), and it is where most of the US units and unclear items sit.

### The 17 wrong items

Most are single mistakes; a few are worth knowing about because they matter to a candidate:

- **Two Ontario regulation facts.** An item treated a combined chlorine residual above 3.0 mg/L as an adverse result under O. Reg. 170/03. The adverse results are low residuals (free below 0.05 mg/L, combined below 0.25 mg/L). A second item had the wrong corrective-action residual.
- **Sludge age.** The Gould sludge age definition was upside down.
- **Settleometer reading.** A small settled volume with cloudy liquid (pin floc) was keyed as young sludge. It points to old, over-oxidized sludge.
- **Pumps.** A broken discharge line was keyed as lowering pump power. It raises it. A restriction was keyed as raising power. It lowers it.
- **Jointing.** A "good" statement said bell-and-spigot joints are mainly for sanitary sewers. Modern push-on water main joints are bell-and-spigot.
- **Lamping.** The description used a camera lowered in a manhole, not a light between two manholes.
- **AWWA water audit.** Unauthorized consumption was tied to billing records. The method uses a default percentage of the system input volume.

The full list, with the reason for each and the corrected row, is in `problems-found.json`.

## What was changed

- **Draft tables.** 152 tables were edited. Every edited table passes `check-draft.ts`. Three small top-ups were added so that no course falls under 150 items per mode.
- **Seven older base-bank items could not be repaired.** They have no corrected version and are only to be excluded from the live bank.
- **Live items.** 1,379 live items now need to be excluded and replaced, about 4.6 percent of the live bank. The list is `../live-items-to-replace-20261115.json`. It has two parts:
  - items whose source row in a table was corrected (the corrected row is in the draft tables on this branch);
  - 380 live copies of 288 older base-bank items that come from no table. Their corrected versions are in `replacement-items.json`, 281 of them with a fix and 7 to be removed.

### Counts after the changes

After excluding the 1,379 items, and counting the corrected drafts that replace them, every Ontario Class 1 to 4 course and every western (WPI) course is at or above 150 items in each of the six modes. The lowest course and mode has 152.

Three Ontario Class 1 courses dropped under 150 after the exclusions and were topped up from generic metric rows in the matching western Class 1 tables:

| File | Course | Mode topped up |
|---|---|---|
| `class1-water-r4.ts` | Class 1 water treatment | Speed match |
| `class1-water-r4b.ts` | Class 1 water treatment | Rapid swipe |
| `class1-wastewater-coll-r4.ts` | Class 1 wastewater collection | Rapid swipe and speed match |
| `class1-water-dist-r4.ts` | Class 1 water distribution | Before or after |

## What this review does not cover

- It is a Claude review, as the owner directed. The 45 web checks settled the disputed facts, but most items were judged on the reviewers' knowledge. Two Ontario licensing claims could not be confirmed on the web and were left as written: reciprocity excludes Quebec, and the general section has 40 questions.
- Nothing here is live until Manus publishes the corrected tables and applies the exclusions. See `docs/manus-request-western-release-and-fixes-20261115.md`.
- The three US courses and the OIT course were read with the same instructions, but US rules were not checked against each state's own exam outline.
