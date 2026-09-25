# Echelon continuing education pilot: self-paced delivery and review

Edition: 2026-09-24.1. Course developer: Ayoola Bello. Status: ten pilot curricula and proposed self-paced delivery. None is an approved CEU course, validated contact-hour award, operator qualification or production deployment.

## Course inventory

| Course                                                | Planned hours | Modules | Module checks | Final questions |
| ----------------------------------------------------- | ------------: | ------: | ------------: | --------------: |
| Drinking Water Operations and Regulatory Compliance   |            10 |       6 |            12 |              12 |
| Water Treatment Process Control and Optimization      |            10 |       6 |            12 |              12 |
| Wastewater Treatment Operations and Process Control   |            10 |       6 |            12 |              12 |
| Sampling, Laboratory Results and Data Quality         |             3 |       4 |             8 |               8 |
| Disinfection Verification and CT Calculations         |             4 |       4 |             8 |               8 |
| Coagulation, Filtration and Controlled Optimization   |             4 |       4 |             8 |               8 |
| Instrumentation, SCADA and Operational Data Integrity |             3 |       4 |             8 |               8 |
| Distribution Water Quality and System Integrity       |             3 |       4 |             8 |               8 |
| Collection Systems and Wet-Weather Response           |             3 |       4 |             8 |               8 |
| Activated Sludge Troubleshooting and Solids Control   |             4 |       4 |             8 |               8 |

The 54-hour sum is an inventory of separate courses, not an earned-credit claim.

## Self-paced learner journey

The learner enrolls with a name and operator ID. The supplied name and ID are displayed on the completion record; enrollment is not an independent identity verification. Modules contain lessons, source readings, fictional case evidence, server-graded case exercises and formative checks. Each module's rubric criteria have keyed exercise items, including numeric, single-choice, multiple-select or ordering questions where appropriate. A learner must pass each case exercise at 70% and every module check. Explanations are shown after submission; retries are unlimited, and choice order changes on retry. Answer keys and authoring guides remain on the server.

The client sends heartbeats while the learner is in a visible tab and has interacted within the preceding five minutes. A server heartbeat credits only the elapsed time since a preceding timely heartbeat, at most 60 seconds; it does not credit time during a gap, an idle period or a hidden tab. Module minimums are currently the sum of the planned activity minutes. The final remains locked until every module meets its minimum and total recorded time meets the planned duration. An atomic per-learner, per-Toronto-date counter limits time credited across courses to seven hours daily. These are engagement signals, not proof of attentive study; representative timed pilots must establish appropriate minimums. Breaks do not count, and a ten-hour course spans at least two dates.

The final is server graded at 80% (at least 7/8 or 10/12). Failed attempts may be retried after studying feedback. A submitted passing final, passed case exercises and checks, and recorded minimum time cause the server to issue a unique immutable non-credit completion record immediately in the same transaction. No instructor or administrator action is required. The record includes learner name, operator ID, Echelon course key, completion time, recorded minutes and final score. An optional evaluation can be submitted before completion but does not gate it.

The curriculum's original assignments, rubrics and facilitator guides remain in server-only source files as authoring and approval materials. They are not part of the learner endpoint or an ongoing marking process. Free-text learner notes are optional and ungraded.

## Course approval and content quality

Ayoola Bello is the course developer for the one-time application materials. Before public credit claims, independently check calculations, units, case realism, source currency, assessment quality, accessibility and local requirements. Run timed pilots with representative learners; revise module allocations and advertised hours to reflect observed active learning rather than padding time. The current case exercise bank maps every rubric criterion, but its distractors require a dedicated technical and editorial review before a regulated-credit submission.

Drinking-water courses require the applicable Director approval; wastewater-only courses may be assessed for CEU value but cannot be called Director approved for drinking-water renewal. Do not equate pilot records or planned hours with an assessed CEU value. The current application has no approved WWOCS course ID and issues no approved-credit certificate. Follow the current Ontario and OWWCO application instructions, including the course developer's qualifications, the completion policy, evaluation mechanism and other supporting materials.

- https://www.ontario.ca/page/director-approved-drinking-water-continuing-education-guide-training-providers
- https://owwco.ca/training-providers/

## Records and WWOCS export

One record belongs to a verified email, course and edition. The course starts only after authenticated enrollment. Writes use a row lock, revision checks, and attempt IDs for retry-safe submissions. Completed records reject later mutations. Module active seconds, attempt counts, operator ID and the daily cross-course time ledger are persisted alongside the versioned state. All course content and keys must be edition-pinned before actual learners use a release; replacing a released question requires archived-edition retrieval.

The server-only formatter `server/ceu/wwocsExport.ts` prepares CRLF-terminated `.txt` rows in the OWWCO format `WWOCS operator ID;WWOCS course ID;YYYYMMDD`. It refuses an absent approved course ID or an incomplete/nonnumeric operator record. The application provides no upload action or bulk export endpoint until a real WWOCS course ID and operational authorization exist. The internal Echelon course key is never substituted for that ID. Upload is a manual provider operation after applicable approval or assessed value.

Use fictional case data in learner work; do not upload confidential workplace records. Confirm retention, privacy, correction and backup procedures before real pilots. Heartbeat activity can be simulated by a client and is not independent proof that a learner read the page; approval materials must accurately describe this limitation.

## Release

Migration `0072_ceu_learning_records.sql` remains proposed-only and has not run in production. Its checksum and manifest were updated in this branch to add the learning record and atomic daily time ledger. Rehearse it against a disposable database, run schema verification and CEU lifecycle/browser tests, then apply it through the guarded production process only after Ay's explicit go-ahead. Do not use `drizzle-kit push`.

If the application rolls back, preserve the new tables and learning records. Verify enrollment, save/resume, case grading, heartbeat pause and daily cap, final unlock, automatic non-credit completion and print output on controlled pilot accounts before availability is announced.
