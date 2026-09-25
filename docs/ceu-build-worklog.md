# CEU build checkpoint

Base: `b862837aa72f2c272197b9ce9e13d29577971a57` (main). Branch: `codex/ceu-ten-course-learning`.

Authorized scope: build ten applied continuing-education pilot courses and replace the session-only preview with saved learning, server grading and instructor-reviewed completion. Preserve current Manus visual changes. Production deployment and migration have not been performed.

Authored: ten curricula, 46 modules, 92 formative checks, 92 final questions, practical evidence packs and facilitator guides. Three flagship courses target ten hours of self-paced study; seven focused courses target three or four hours. Durations require timed pilots. Approval, qualification and assessed CEU claims remain absent.

Implemented: public catalogue and reading, authenticated practical and assessment drafts, versioned records, server grading, optimistic concurrency with row locking, idempotent final submissions, submission history, admin instructor review, documented reassessment, verified participation, evaluation and immutable non-credit completion. The proposed additive migration is registered and checksum-verified.

Review materials: `docs/ceu-delivery-and-review.md` and `docs/ceu-authored-edition-audit.md`. Curriculum keys and marking guides live under `server/ceu/courses/`; public metadata is generated with `node scripts/ceu/generateCatalogue.mjs`.

Validation: local TypeScript, 19 focused tests, production client/server builds and migration manifest checks passed. Database and browser journeys are configured for the disposable CI environment. Review remote results before merging. No actual learners, instructor accounts, production permissions or CEU approvals were created.

Self-paced reconciliation: preserved concurrent delivery update e7f332a. Replaced live discussion allocations with written reflection and revision, removed the fixed two-day timetable, and clarified manual instructor verification of learner activity logs. There is no automatic active-time tracker; breaks and review turnaround never count toward learner minutes.
