# Lift Stations for Wastewater Operators: draft notes

Draft only. Not committed or registered. Key `ceu-lift-stations`, version `2026-11-26.1`, plannedMinutes 240, non-credit wording as in the model. `stream` is `drinking_water` because the schema allows one value; content is for wastewater operators. Build scripts and figures are in `ceuwork-lift/` (build.py, validate.py, verify.py, docs.py, gap.py, figs/).

## Counts (validate.py, 2026-11-26)
- 4 modules (`why-lift-stations`, `pumps-and-drives`, `controls-and-monitoring`, `operation-and-troubleshooting`), 6 checks each (24), 5 finals and 5 alternates per module (20 and 20). 64 ids and prompts unique, 4 distinct choices, in-range correctIndex.
- Correct positions: checks 6/6/6/6, finals 5/5/5/5, alternates 5/5/5/5. No banned words in options; no correct option strictly longest.
- Lesson words (figures excluded, after review round 3): why 1,516 / pumps 1,625 / controls 1,474 / operation 1,406. Pumps is over the 1,500 target, under the 1,700 hard maximum. Headings 7 / 8 / 7 / 8.
- 7 original inline SVG figures (M1 two, M2 two, M3 two, M4 one), 1.3 to 2.0 KB each, no style attributes, text 11 units or more, rendered at 390 px and viewed; overlaps in figures 1 and 3 fixed.
- Activities 60 min per module, 240 total; last activity of module 4 is the final assessment.
- 24 numeric answers recomputed by `verify.py` (python3 -I) with separate formulas; all match to the stated rounding; no correct answer equals a number in its prompt.

## Constants used
7.48 gal per cu ft; 8.34 lb per gal; 2.31 ft of head per psi; 33,000 ft-lb per min per hp; 0.7457 kW per hp; 1,440 min per day; 1 MGD = 1,000,000 gal per day; 60 min per hour. Affinity laws: flow with speed, head with speed squared, power with speed cubed.

## Sources
WEF MOP 11 Vol I Ch.8 (plus Ch.2, 5, 6, 7, 10, 17 passages), Spellman Vol I, Vol II, 2nd-ed Handbook, and Wisconsin Advanced Wastewater guide 22.1.1 (contrast with positive displacement pumps only; it does not cover centrifugal start-up). Spellman Vol III (sp4) problem 5.12 was used to confirm the inflow-from-level-rise relation but is not listed as a source. Claim-by-claim check: `ceu-lift-stations-SOURCECHECK.md` (83 lesson claims supported, 12 not covered, 0 contradicted).
URL problem: the book sources have no URL and are written without the `url` key like `wef-mop11` in the model; confirm the importer accepts that. Web sources: Wisconsin guide (200) and CCOHS confined spaces introduction (200; page not read claim by claim, pointer only). OSHA and NIOSH pages returned 403 to curl and were not used.

## Royce U gap check
Equivalent course is `lspu` (Lift Stations Overview, 292 slides, all read). codes.json lists `lspp` as Lime Softening, which is not it. 44 topics: before YES 4, PART 14, NO 26; after YES 11, PART 21, NO 12. See `gap-report-lift-stations.md` for the table, additions and declined items.

## Items for the reviewer
- Not covered by the books (flagged in SOURCECHECK): high level alarm below the incoming sewer, typical alarm and telemetry signals, PLC change record, equipment kept minimal in wet wells, starts-per-hour limit from the motor maker, the half-pump-rate starts maximum (derived), overflow layers and notification, course policy on staying out of wet wells.
- Page markers for Spellman are approximate. MOP page for the sulfide passage is Ch.17, 17-20 to 17-21.
- Pinecrest Hollow arithmetic: the 9 percent figure is 6 ft over 65 ft TDH; gauge 31 psi gives 71.6 ft against 71 ft calculated.

## Scope limits applied
No regulatory limits stated; no numeric motor or oxygen limits. Safety is recognition and purpose only: no entry, testing, rescue, lockout or permit steps. Lockout/tag-out mentioned only as a purpose. Notification and alarm routing defer to the owner's procedures, applicable rules and permit. Names are fictional (Pinecrest Hollow, Millbrook Landing, Quarry Bend, Harrow Ridge; Rosa Delgado, Kenji Marsh, Tessa Okoro, Dev Raman, Hana Sutter, Luis Ferreira, Mei-Lin Castro, Arjun Bell) and were not checked against real places or people.

## Second-model review (2026-11-26)
- Reviewer: GPT Sol 6.2 (`gpt-6.2-sol`) only. Gemini neon did NOT review this course (no credential here). Three rounds; 33 planted errors, 33 caught after hand check (30 by the scorer). Full table in `ceu-lift-stations-REVIEW-RESULT.md`.
- Pre-review backup: `ceu-lift-stations.pre-review.json`.
- The 12 NOT COVERED lesson claims were all kept after check (general, no figures); wording changed where needed. Derivations for the starts-per-hour claim are in SOURCECHECK.
- Figures were not changed in the review and were not re-rendered after text edits.
