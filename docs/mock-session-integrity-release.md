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
