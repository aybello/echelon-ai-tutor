# Fixes to four older CEU courses (2026-11-27)

These are fixed drafts of existing live courses, for review. Nothing here is merged or deployed. The owner must approve before any change reaches `main`.

| Course | Fixed file | What changed | Still open |
|---|---|---|---|
| Disinfection CT | ceu-disinfection-ct.json | Rubrics and assignments rebuilt from each module's data; unverified 73/105 values replaced with the textbook's 104; unsourced 24-hour rule removed; back-solve rule made consistent; activities 240 min | Lessons 2 to 4 at about 1,700 words; Health Canada and O. Reg. 170/03 values not verified |
| Water Treatment Process Control | ceu-water-treatment-process-control.json | Rubric numbers corrected; assignments made self-contained; 24-hour claim removed; checks 9/9/9/9 (5 SVGs); overclaiming distractors rewritten | Overlap with Coagulation and Filtration; prerequisite course not in repo; repo test suite not run |
| Wastewater Treatment Process Control | ceu-wastewater-treatment-process-control.json | Undiluted SVI fixed (dilution above 250 mL/L); undefined data supplied; return-loop figure redrawn; checks 9/9/9/9; activities 240 min (6 modules at 40) | Duration changed from 600 to 240 minutes: confirm with the owner; RAS routing to confirm on plant drawing; repo test suite not run |

Each `-CHANGELOG.md` lists every change with its reason and evidence.

Drinking Water Compliance is not included: it is waiting on the owner's decision (Ontario-only or jurisdiction-neutral).

Source list: textbook sources are cited inline only, because the catalogue requires a web link for each source. Owner decision pending. Do not block on it.
