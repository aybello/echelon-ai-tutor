# Recruitment Assessment backend

V1 identity-locked knowledge assessments for existing current Annual organization seats. `server/routers/recruitmentRouter.ts` exposes the ten shared-schema procedures; integration into the root router is owned separately. The manager copies `/recruitment/:assignmentId`. No email is sent and that UUID is not authentication.

## Boundaries and persistence

`access.ts` combines the existing current manager reporting resolver with explicit active/past_due non-course-pass Annual gates. Candidate procedures require a verified OTP/OAuth identity matching the original invitation email, the original assigned same-org/member seat, canonical active region/plan-permitted course, and a current same-org subscription with exact Annual course sentinel, tier and province. They also invoke central `assertAccess`. Personal or other-team purchases do not satisfy the scoped guard; delegated-manager role alone never grants a seat.

`questions.ts` reads authoritative questions through `getDb`, filters withheld learner content and validates option JSON and correct-answer bounds before counts or selection. `service.ts` samples 5–100 questions with every selected module represented. One immutable snapshot is shared by every assignment of a definition. `state.ts` is a pure server-clock transition layer and allowlisted DTO projection. `store.ts` persists locked transitions.

The additive SQL is `drizzle/0087_recruitment_assessments.sql`: only `recruitment_assessments` and `recruitment_assignments`; UUID primary keys, original organization/member/email identity, JSON modules/questions/answers/score, integer millisecond BIGINT timestamps, consent/creator/revoker metadata, unique assessment/member invitation, org reporting and candidate indexes, and a short named assignment-to-definition FK. No existing table alteration. Manifest registration and execution are owned by the integrating agent.

## Concurrency and lifecycle

All candidate operations, including lazy-finalizing reads, take organization SHARE then assignment UPDATE locks. Exact seat and course subscription reads take SHARE locks during the transaction. Annual mutations elsewhere lock the organization; that establishes a common ordering. Manager creation/invitation take organization UPDATE; revocation takes organization SHARE then assignment UPDATE and revalidates manager membership. Transactions use READ COMMITTED. Only attempt state fields are mutable; invite identity, expiry and form content never reset.

Central entitlement preflight runs before acquiring a transaction connection to avoid starving the global database pool. Exact original-org access is then revalidated under transactional shared locks. Server time is captured after lock waits and access queries. Start preserves its original timer and consent, stale save revisions conflict, null clears an answer, terminal states cannot restart, submit scores only durable answers, and timeout uses the deadline timestamp. Lazy finalization returns a terminal view and commits instead of throwing a rollback. Revoke retains existing completed score/answers/consent/timestamps. Repeated invites return the original assignment, never reset it.

Before starting, candidate questions and answers are empty. Active questions use `candidateQuestions`; terminal views hide prompts/options. Candidate DTOs never include answer keys, explanation, score, a database row or other candidates. Durable own answers remain visible after starting. Manager reports recompute scores from snapshot and answers. Reporting reads project overdue rows as timed_out/expired without writing; candidate operations and revocation persist finalization. Completed rows never become expired.

## Self-review and validation limits

The implementation was reviewed against the requested scope, exact shared DTOs, input validation, tenant scoping, identity priority, region and course sentinels, immutable snapshots, question leakage, status/revision/deadline boundaries, transaction lock order, pool starvation, audit persistence, and absence of entitlement/activity/billing/email writes. Catalog question pools and subscriptions are batched, not N+1 per candidate. Helpers accept typed database read boundaries and pure states for mocked testing.

Static compilation and selected safety-preloaded unit tests are local source checks only; exact results are reported in the handoff. No migration generation/application, live database access, release, deployment, commit or production-runtime proof was performed by this implementation task. The integrating agent owns independent model review, full test/isolated-MySQL evidence, migration registration, and release decisions. V1 requires existing course-specific Annual sentinel rows; malformed or legacy differently-linked subscription data fails closed and is not repaired by this feature.
