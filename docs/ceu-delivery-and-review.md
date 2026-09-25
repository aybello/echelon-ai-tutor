# Echelon continuing education pilot: delivery and review guide

Edition: 2026-09-24.1. Status: authored pilot curriculum and proposed learning-platform implementation. Not a regulator-approved course package, verified contact-hour award, operator qualification or production deployment.

## Course inventory

| Course | Planned hours | Modules | Module checks | Final questions |
|---|---:|---:|---:|---:|
| Drinking Water Operations and Regulatory Compliance | 10 | 6 | 12 | 12 |
| Water Treatment Process Control and Optimization | 10 | 6 | 12 | 12 |
| Wastewater Treatment Operations and Process Control | 10 | 6 | 12 | 12 |
| Sampling, Laboratory Results and Data Quality | 3 | 4 | 8 | 8 |
| Disinfection Verification and CT Calculations | 4 | 4 | 8 | 8 |
| Coagulation, Filtration and Controlled Optimization | 4 | 4 | 8 | 8 |
| Instrumentation, SCADA and Operational Data Integrity | 3 | 4 | 8 | 8 |
| Distribution Water Quality and System Integrity | 3 | 4 | 8 | 8 |
| Collection Systems and Wet-Weather Response | 3 | 4 | 8 | 8 |
| Activated Sludge Troubleshooting and Solids Control | 4 | 4 | 8 | 8 |

The 54-hour sum is a planning inventory across separate courses, not an earned credit claim or a schedule for one learner. Do not credit the same learning activity twice across courses.

## Delivery model and timetable

These are self-paced online courses. Learners progress through modules on their own schedule. The planned hours include source reading, calculations, written practical work, asynchronous instructor review and assessment. Reading length alone does not substantiate those hours. Each module contains a minute-by-minute activity allocation in its curriculum record. Final assessment and evaluation time is included in the last module, not added to the advertised total.

The application records active learning time and caps it at seven contact hours per learner per day, excluding breaks. For each ten-hour flagship, the six modules are each 100 minutes of planned activity; the four-module focused courses use 45- or 60-minute modules within the 180- or 240-minute total. Learners take breaks outside those contact minutes. Practical submissions receive asynchronous instructor review with targeted feedback; there are no scheduled live sessions.

Before launch, run a timed pilot with representative learners. Record actual active time separately for source reading, practical work, review turnaround, assessment and breaks. Record where learners needed additional explanation, whether the final allocation was sufficient, and whether learning outcomes were achieved. Revise duration and activities from this evidence; do not pad a course to preserve a planned number. A shorter validated duration requires corresponding catalogue and approval-package changes.

## Instructor preparation and technical review

The curriculum JSON files under `server/ceu/courses/` contain objectives, learner lessons, original fictional evidence packs, assignments, acceptance criteria, facilitator guides, source references and keyed assessments. Public endpoints omit marking guides and assessed answer keys. The administrator-only instructor workspace exposes the complete material and learner evidence.

Before delivering a course, appoint a named reviewing instructor with documented subject expertise, relevant experience and teaching capability. Record qualifications and authorization evidence. The reviewer provides asynchronous feedback on practical work; there are no scheduled live teaching sessions. A technical reviewer must independently check calculations, units, scenario realism, applicability of references and local requirements. The repository's arithmetic and structural checks assist this work; they do not replace subject-matter review.

Read each source's specified section and verify that the linked version is the applicable current one. Some Ontario pages restricted automated retrieval during authoring; indexed official material was available. A legal/procedural review of the full current text remains required before delivery. US EPA resources support technical concepts and do not establish Ontario legal duties. Fictional thresholds, CT requirements, operating bands and response arrangements are case assumptions, never universal operating instructions.

Give learners the prerequisites and self-paced study guidance before enrollment. Check access to a calculator, the source readings and an accessible means of submitting written work. Provide an equivalent accessible exercise or reasonable timing accommodation where needed, documenting the arrangement without lowering the learning standard. Platform controls use native labels and keyboard-operable inputs; an accessibility review with actual learners remains part of the pilot.

## Practical review and successful completion

Each practical must satisfy every listed acceptance criterion. A character-count minimum merely prevents an empty submission; it is not a quality score. Review the reasoning, calculations, evidence references, uncertainty and authority boundaries. Use the facilitator guide to check expected results and acceptable alternatives. Return work with specific feedback when any criterion is unmet. Do not approve a submission merely because it repeats an answer choice or reaches a plausible final number.

The learner may revise returned work. Previous submitted versions and their feedback are retained. Accepted work cannot be edited until an instructor returns it. Review actions are attributed and logged. Instructors cannot attest their own records.

Learners must pass every formative check and submit every practical before opening the final. The final is graded on the server at a minimum of 80%: at least 7/8 or 10/12, as applicable. Three attempts are initially available. After three unsuccessful attempts, an instructor reviews remedial work and the supervised reassessment arrangement, records a reason and may authorize one additional attempt at a time, up to three additional pilot attempts. Final keys are not returned to learner endpoints; instructors may provide targeted remediation without distributing the full key.

A passing final alone is insufficient. Completion also requires accepted practicals, verified active learning time for the validated course duration, and a course evaluation. Learning records must identify active learning minutes excluding breaks, submitted practicals with instructor feedback, and engagement evidence; page-open time alone is not participation evidence. The application prevents more than seven contact hours within one course on one day; reviewers should also check the learner's combined schedule across courses and external activities. Do not double-count overlapping sessions.

An authorized administrator acting as an instructor verifies the complete record. The pilot issues only a named non-credit learning record with a unique identifier and explicit statement that no approved CEUs, operator qualification or regulatory recognition are awarded. Completed records are immutable through the learning API. Any later correction requires a documented administrative process preserving the original; there is no silent completion-edit action.

## Approval package still to complete

The owner must complete the applicable Ontario/OWWCO process before making an approval or assessed-value claim. The authored objectives, module timetable, content, exercises, assessment policy, marking guides, source list and evaluation mechanism support that package. Outstanding items include named provider/instructor details, qualifications, independent technical sign-off, timed-pilot evidence, the final delivery and attendance procedure, the regulator's current application requirements and any required written approval/review outcome.

Drinking-water and wastewater review paths differ. Do not describe a wastewater-only course as Director approved for drinking-water renewal. Do not equate planned contact hours with an already-assessed CEU value. The current application deliberately has no approved-course identifier or approved-credit certificate template.

Official review references:

- https://www.ontario.ca/page/director-approved-drinking-water-continuing-education-guide-training-providers
- https://owwco.ca/training-providers/

## Records, access and operation

The proposed `ceu_learning_records` table stores one record per verified email, course and edition. Learner identity comes from the existing verified OAuth/email-session context, never an input email. Writes use a database transaction and row lock with revision checks. Retried final submissions use an attempt identifier to avoid duplicate attempts. Practical drafts and optional assessment drafts are explicitly saved; unsaved work remains marked in the browser. A failed request is not reported as saved.

Instructor access currently requires the existing administrator role. Organization managers do not automatically gain access to these learner records. The review selector shows the latest 100 records; larger delivery cohorts need pagination/filtering before this interface is relied on at scale. Review access should be limited to authorized personnel; no instructor accounts or production permissions are provisioned by this change.

Practical submissions should use the supplied fictional data. Do not upload confidential workplace records or unnecessary personal information. Before collecting real pilot records, confirm the provider's retention, backup, privacy, access-review and correction procedures. No new universal retention period is invented here. Define and publish the applicable policy through the provider's governance process.

The edition is frozen once used by learners. For a future revision, preserve the original curriculum and keyed order, implement explicit archived-edition retrieval before replacing the current registry, and test that old records remain reviewable. This initial release rejects cross-edition mutation; it does not yet provide an archive browser. Do not overwrite a released edition to change a question's meaning or answer position.

## Deployment and rollback

This branch does not apply a production migration. The additive migration `0072_ceu_learning_records.sql` is registered with a checksum and the repository's guarded forward-migration process. Rehearse it against a disposable database and run schema verification and the database-backed CEU tests. Apply it in the approved production release process after backup verification, then deploy the compatible application. Never use `drizzle-kit push` as a shortcut.

If the application needs rollback, restore the prior application version while preserving the new table and learner records. Do not drop collected learning evidence. The old preview is replaced in the new application; after rollout, verify the catalogue, sign-in, draft recovery, grading, instructor review and non-credit completion on a controlled pilot account before announcing availability.
