# CEU course build runbook (read this before ANY CEU course work or agent brief)

Written 2026-11-26 because the build process was repeatedly dropped when a long session was summarised. The authoritative rules are the existing files below; this page says which to read and in what order. Do not invent a new procedure.

## Read first, every time
1. `docs/handoff/course-briefs/COMMON.md`: structure the tests enforce, question rules, hard limits, diagrams, sources, checks, and the required Royce U step.
2. The course's own brief in `docs/handoff/course-briefs/<course>.md` if one exists (see chlorination-principles.md for the shape). Write one for each new course.
3. Finished models: `content/ceu-drafts/ceu-basic-hydraulics.json` and `ceu-basic-math.json` with their `-NOTES.md` and `-REVIEW-RESULT.md`.
4. `docs/handoff/gap-reports/` for the shape of a gap report; `docs/handoff/tools/review_course.py` for the second-model review.

## Steps for each course
1. Brief: write `course-briefs/<course>.md` (modules, suggested diagrams, question mix, constants).
2. Draft to COMMON.md: 4 modules, 6 checks per module, 5 finals and 5 alternates per module, 4 choices each, lessons about 1,200-1,500 words with at least four `###` headings, at least five original inline SVG figures per course, fictional scenarios, no exact regulatory numbers stated as rules.
3. Textbook check while drafting: verify claims against the books and keep a `<course>-SOURCECHECK.md` (claim, SUPPORTED / CONTRADICTED / NOT COVERED, quoted evidence). Sources used so far: WEF MOP 11 6th ed. (Vol III Solids: Ch. 29 thickening, 30 anaerobic, 31 aerobic, 32 additional stabilisation, 33 dewatering; Vol I Ch. 8 pumping), Spellman handbooks, Water Quality Control Handbook (Alley, WEF), Wisconsin DNR study guides, California range-of-knowledge.
4. Royce U gap check (owner requirement, COMMON.md last section): extract the equivalent Royce U course (`royce/<code>/data/slide<N>.js`), read every slide, list topics, mark YES/PART/NO against our draft, fill NO/PART in original words from official or standard sources, record the table in NOTES. Never copy wording, questions, examples, images or numbers. Write `gap-reports/<course>.md`.
5. Second-model review (owner instruction 2026-11-26: when a course is done, have **Gemini neon and GPT Sol 6.2** both check it): `docs/handoff/tools/review_course.py <course.json> <outdir>` (plants errors in a review copy to prove the reviewer catches them). Record `-REVIEW-RESULT.md` naming both reviewers. The tool still names older models; update its model names to Sol 6.2 and neon before use. Sol 6.2 works through the proxy (`Authorization: Bearer placeholder`). Gemini has no credential in this environment: the owner must add one in the environment settings (Gemini's OpenAI-compatible endpoint takes it as a Bearer token). Until then, record that only Sol 6.2 reviewed. Do not use any key pasted in chat.
6. Recompute every calculation with a separate `python3 -I` script; run the draft contract checks (counts, unique ids and prompts, banned option words, balanced answer positions).
7. Publish through Manus only: course JSON under `server/ceu/courses/`, catalogue entry, cover and photos to managed media, re-baseline `managed-media-baseline`, PR to `main`. Claude does not push to `main` and does not open a PR without the owner saying yes.

## Known open items (2026-11-26)
- Book sources have no URL but the `CeuSource` type requires `url`. Owner decision pending: make it optional or use a publisher page. Never invent a URL.
- Queue order: Sludge Thickening, Digestion, Dewatering, Lift Stations, Effluent Filtration, Reverse Osmosis, Lime Softening, Chloramines, Fluoride.
- Two foundation courses (Water and Wastewater Treatment Concepts) are published on `claude/ceu-two-foundation-courses`; waiting on Manus (baseline, covers, photos, PR).
- Drafts from this session were briefed with one figure per module and 1,500-2,000 word lessons; COMMON.md asks for at least five figures per course and 1,200-1,500 words. Reconcile before publish.
