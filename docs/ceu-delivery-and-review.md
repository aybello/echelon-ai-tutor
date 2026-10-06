# Echelon continuing education pilot: self-paced delivery and review

Current learner contract: 2026-09-29. Course developer: Ayoola Bello. These ten courses are non-credit pilots. They do not award approved CEUs, validated contact hours, operator qualifications or regulatory recognition.

## Course inventory

| Course | Modules | Optional quick checks | Final questions |
| --- | ---: | ---: | ---: |
| Drinking Water Operations and Regulatory Compliance | 6 | 36 | 30 |
| Water Treatment Process Control and Optimization | 6 | 36 | 30 |
| Wastewater Treatment Operations and Process Control | 6 | 36 | 30 |
| Sampling, Laboratory Results and Data Quality | 4 | 24 | 20 |
| Disinfection Verification and CT Calculations | 4 | 24 | 20 |
| Coagulation, Filtration and Controlled Optimization | 4 | 24 | 20 |
| Instrumentation, SCADA and Operational Data Integrity | 4 | 24 | 20 |
| Distribution Water Quality and System Integrity | 4 | 24 | 20 |
| Collection Systems and Wet-Weather Response | 4 | 24 | 20 |
| Activated Sludge Troubleshooting and Solids Control | 4 | 24 | 20 |

Each course has an alternate final set of the same length. The server issues each attempt's question and option order and grades against its saved manifest. The course endpoint supplies the current `finalQuestionCount`; catalogue completion instructions deliberately avoid a fixed count so assessment expansions cannot leave stale learner instructions.

## Self-paced learner journey

1. Preview the lessons and sample questions without an account. Preview questions cannot be submitted for grading.
2. Sign in and enroll with a name and operator ID to save learning. These supplied fields appear on the certificate; they are not independent identity verification.
3. Work through each module's slides in order and select **Complete module** on its last slide. Previously visited slides remain available for review. Progress and the current slide are saved on the server. A failed save keeps the learner on the current slide with a retry message.
4. Use optional quick checks for practice. Their scores, case exercises, free-text notes, course evaluation and recorded active time do not gate module completion or the final exam.
5. Complete every module to unlock the final exam. Answers and review flags save to a server-issued draft. Reopening the exam resumes that draft. Failed saves are disclosed with **Retry save**, and unsaved answers trigger an exit warning.
6. Score at least **80%** on the server-graded final: 16/20 or 24/30 for the current inventory. A failed attempt provides feedback and can be retried. A passing attempt immediately issues an immutable non-credit certificate in the same transaction. No instructor or administrator approval is required.
7. View or print the certificate. It displays the learner name, operator ID, course title, completion date, final score and certificate reference. It does not display recorded minutes as earned contact hours. Evaluation is optional and does not delay the certificate.

`shared/ceuLearning.ts::ceuReadiness` and `server/ceu/learningState.ts` implement the completion rule: all modules completed plus a passing final. The public catalogue, course delivery metadata and course screen must describe that same rule.

## Historical records and authoring materials

Keep existing case attempts, formative answers, drafts, recorded activity and daily time ledgers. Legacy passed case exercises still count as completed modules so an existing learner does not lose progress. The retained case-grading and heartbeat endpoints support historical records; their minimum-time and seven-hour recording controls are not requirements of the current slide-based learner journey.

Planned activity minutes and curriculum assignments, rubrics and facilitator guides remain server-only authoring and potential approval materials. They do not establish the observed duration of the current course. Do not treat planned minutes, heartbeat activity or a non-credit pilot certificate as an approved contact-hour award. Representative timed pilots must validate duration before any advertised credit claim.

## Course approval and content quality

Before making public credit claims, independently review calculations, units, source currency, assessment quality, accessibility and the applicable local requirements. Drinking-water courses require the applicable Director approval. Wastewater-only courses may be assessed for CEU value but cannot be called Director approved for drinking-water renewal. The current pilot issues no approved-credit certificate.

- https://www.ontario.ca/page/director-approved-drinking-water-continuing-education-guide-training-providers
- https://owwco.ca/training-providers/

The server-only formatter `server/ceu/wwocsExport.ts` refuses an absent approved WWOCS course ID or an incomplete/nonnumeric operator record. The internal Echelon course key must never substitute for an approved course ID. No upload or bulk export action is provided by the learner flow.

## Persistence and release verification

Records belong to an authenticated email, course and edition. Writes use row locks, revision checks and retry-safe attempt IDs. Completion records are immutable. Keep released assessment editions available when questions change so saved drafts and results continue to use their original keys.

This catalogue and accessibility correction requires no database migration or content import. Preserve existing records. Check the actual deployment's migration ledger rather than relying on an old document's claim about whether `0072_ceu_learning_records.sql` was applied.

Verify public preview, saved-slide resume, an interrupted slide save, interrupted answer saving, saved-exam resume, fail/retake, the 80% boundary, automatic certificate issuance, account isolation and mobile layout. Browser checks also require one main landmark on catalogue, lessons, exam, results and certificate views. Use disposable fixture accounts and a local test database; do not manufacture completions in production.
