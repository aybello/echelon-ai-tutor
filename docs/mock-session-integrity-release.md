# Issued mock sessions and bounded recovery writes

This follow-up closes the remaining mock-integrity gaps after PR #70. The server issues a random session ID and HMAC-authenticated manifest binding the verified learner, canonical course, physical question bank, history key, exact question IDs, start time and deadline. It uses the existing JWT_SECRET with a separate signing domain; no database migration or new secret is needed. The manifest contains a keyed identity hash, not an email address.

The start endpoint checks existing course access, samples eligible questions on the server and enforces the course's actual exam size (100 questions, or 50 for Wastewater OIT). Insufficient banks fail clearly instead of creating a shorter passing mock. OIT previews remain 30 questions and cannot write full mock scores or mark a pass. 309A continues to use its free active beta bank and blueprint. Wastewater product keys now resolve to the canonical physical database bank when scoring.

Submission requires every issued question exactly once; unanswered items remain null and count as incorrect. Unknown, duplicate, replaced, cross-course, cross-learner, altered-token and unissued submissions fail. The unused legacy browser-scored saveResult endpoint is retired. Server elapsed time is bounded by the issued duration. New submissions expire five minutes after the exam deadline to allow transport delay; already committed results can be retried after expiry, including after question-bank edits, without writing duplicate attempts. This is an exam integrity measure, not proctoring or proof of sustained study.

The browser saves recovery data after answers, flags, navigation and save-state changes, with no writes on idle timer ticks. The fixed deadline restores remaining time. Previous v1 drafts are retained for answer review but cannot be promoted into issued results. Learners must start a new exam to record a new result. Expired unsaved drafts remain reviewable, and the message explains why they cannot be saved.

## Verification and release

- Unit submission tests cover full failing/passing exams, unanswered items, tampering, ownership, expiry, replay after expiry, preview exclusion and the retired endpoint.
- The existing database integration stage exercises start-to-submit with a real 100-question fixture, rejects altered submissions without writes, and verifies atomic rollback and concurrent retries.
- The existing Teams browser journey now seeds 100 questions, verifies idle ticks do not write recovery storage, answers one question, refreshes, forces a save failure, retries, and verifies exactly one 1/100 result and 100 attempts.
- The release requires the complete Quality Gate and a coordinated client/server deployment. No production mutation, email delivery or migration is performed by these tests; fixtures belong only in isolated test databases.
- After deployment, use synthetic accounts to verify a full mock and a free OIT preview. Old unsigned clients should receive an explicit refresh/start-new-exam error.

## Learner history and Course Pass reporting correction

The follow-up uses the course registry for activity aliases and the physical question bank separately. A stored course key takes precedence over the bank key and old exam label. Class 1 results from the former combined page are separated by their recorded stream; ambiguous legacy attempt rows without stream evidence are excluded rather than assigned to the wrong course. Ontario treatment, distribution, collection and WPI activity remain separate. No historical records are rewritten.

History now uses the verified learner identity consistently across OTP and OAuth sign-in. Active/claimed Course Pass operators can appear in the manager report using their verified email even without an OAuth user ID. Invited licences still show zero activity until claimed; manager authorization is unchanged. Both manager totals and readiness use the same identity and course scope. Readiness resolves question numbers within the physical bank to count actual topics, including older mocks that stored only broad module names. New mocks store the question topic while retaining the module score breakdown.

Validation includes an isolated database reporting stage after the existing integration tests (avoiding concurrent fixture mutations in the same banks), plus Ontario and WPI browser journeys covering learner history and manager progress. The Ontario browser case also submits from the combined Class 1 Wastewater page and the dedicated route, and verifies both results appear in the same history. This correction requires no additional migration. After the complete Quality Gate passes, deploy the client and server together; verify these routes with synthetic learners and managers before calling the release complete.

The expanded browser journeys also exposed an OTP input focus race: a delayed focus callback could move focus during rapid code entry and leave a digit blank. Focus now occurs when the code inputs mount, before paint, and failed-code retries focus immediately. The tests continue entering digits directly without artificial delays. Authentication and OTP verification rules are unchanged.
