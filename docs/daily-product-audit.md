# Echelon daily product audit and improvement

Owner: father. Implementation agent: Manus AI.
Updated: 2026-10-16.

## Purpose

Act as a product quality engineer, not a status reporter. Find broken behaviour, confusing journeys, lost progress, missing explanations, inconsistent courses, mobile problems and conversion friction. Reproduce the problem, fix it where the intended behaviour is clear, add a regression test, and verify the result. Protect revenue as part of product quality, not as the entire audit.

A healthy HTTP response is not proof of a working page. A source-text check is not a browser test. Passing a structural question scan is not proof that the educational content is correct. No defects found means no defects found in the recorded coverage, not that the app is defect-free.

## Start each run

1. Read the Notion AI Context Hub at `34b435c8-13b9-8197-b43f-e56439d9a7b2` and recent Echelon session entries. Do not treat historical entries as current code or production evidence.
2. Locate `/home/ubuntu/echelon-ai-tutor`. If unavailable, use the authorized existing `aybello/echelon-ai-tutor` repository, not a replacement app. Inspect the working tree before editing. Preserve other work. Fetch GitHub main, inspect open PRs and recent merges, and record the exact starting commit. Never reset or force-push to get a clean tree.
3. Confirm access to the existing deployment context and authoritative database. Missing access is a blocked check, not a pass. Do not enable new permissions or connect accounts on behalf of an unattended run.
4. Check live provider catalogues before selecting models. Use Gemini Argon for the main analysis and GPT Sol for independent validation, using the exact supported current IDs. Call providers directly with their environment variables. Do not silently substitute a cheaper model.
5. Read this playbook from the current checkout. Run `node scripts/daily-audit.mjs` for baseline evidence. The production tutor-generation probe is opt-in, not a default repeated load generator. Do not repeatedly burn the free allowance to produce a green report.

## Every day: baseline and real use

- Review new customer feedback, tutor errors, unresolved issues, failed CI and code changed since the previous audit. Read inbox feedback only through the authorized Echelon account if available. Never send replies automatically.
- Use the app as a signed-out visitor on desktop and phone. Test course discovery, a real quiz answer and explanation, next-question navigation, flashcard flip and study controls, mock entry controls, tutor panel reachability, account sign-in entry, jobs application destinations and Teams purchase entry. Do not submit real applications, purchases, attestations or customer messages.
- Run the active-course route and API matrix from the real course registry. Check for actual content, intentional gates, empty banks, wrong course or region, 404 screens hidden behind HTTP 200, failed chunks and unhandled browser errors. A route smoke check does not stand in for a complete exam lifecycle.
- Check content structure across learner-visible banks. Separately examine reported or changed questions for answer correctness, explanation quality, units and formula breakdowns. Preserve question IDs and learner history. Do not bulk rewrite or delete questions because a pattern scanner flags them.
- Check the authoritative data and existing regression guards for missing revenue sources, broken lead capture, access failures and course consistency. Do not call counts of table rows a revenue reconciliation. Do not call OTP or checkout events unique captured leads.
- Run deterministic tests with isolated test settings and no inherited production database, Stripe or SMTP credentials. Database-mutating integration tests belong in disposable test databases. If that environment is unavailable, record the gap rather than running against production or silently skipping it.

## Rotating deep review

The baseline above runs every day. Add one deeper area based on the local weekday, plus any urgent real customer problem. Track the last completed area in the session log so blocked work is not forgotten.

| Day | Deep area | Real behaviours to trace |
| --- | --- | --- |
| Monday | Practice and learning | Filters, calculations-only, answer state, explanations, retry mistakes, bookmarks, next question, resume and progress |
| Tuesday | Mock exams and review | Start, timer, navigation, skipped questions, resume, server scoring, results, incorrect-answer review and Ask AI Tutor on each review question |
| Wednesday | Tutor and study tools | Answer quality, mathematical steps, truncation, retry behaviour, mobile composer, formulas, flashcards, notes, Equipment Lab and Process Guide |
| Thursday | Accounts, access and Teams | Restore access, sign-in, account routing, manager/operator views, course assignment, invite lifecycle, Flex and region boundaries |
| Friday | Discovery and conversion | Course selector, regional consistency, pricing clarity, checkout entry, purchase confirmation, lead capture and employer journeys |
| Saturday | Jobs and public content | Search/filter states, job details, real application destinations, expired listings, blog links, public tools and empty states |
| Sunday | Reliability and reporting | Recent changes, intermittent loads, slow/offline recovery, cross-device state, mobile layouts, accessibility and admin data completeness |

Do not claim every course was deeply tested when only one representative journey was used. Critical fixes must be checked across Ontario, WPI, US and free-beta paths where applicable. Preserve deliberate differences such as certified regional course ceilings and the free 309A beta.

## Fix and improve

1. Rank verified findings: lost money or access, lost learner work, wrong educational result, broken core action, confusing or inaccessible experience, then cosmetic polish.
2. Reproduce against current source and the live app or isolated test data. Save the URL, starting commit, expected behaviour, observed behaviour and minimal sanitized evidence. A model suggestion is not a verified defect.
3. Inspect existing components before replacing anything. Prefer the smallest shared fix that solves the cause across courses. Improve a confusing label, missing state, inaccessible control or unnecessary step when the existing product intent makes the correction clear.
4. Make a small, reversible batch. Add a test that fails on the old behaviour. Run focused tests, type checks and relevant browser journeys. Check persistence and every write path when money or identities cross modules.
5. Obtain independent GPT Sol validation of the exact candidate commit. For revenue reporting, pricing, checkout, entitlements, Teams or Flex changes, obtain BOTH Gemini Argon and GPT Sol reviews. Fix findings and re-check. No reviewer replaces a direct trace of the implementation and data.
6. Ship safe, verified fixes using the existing authorized GitHub and deployment flow when available. Check that main has not changed before integrating. Never overwrite concurrent work. Save a checkpoint. Verify the actual serving release or asset identity and the repaired behaviour before saying a fix is live. If publishing is unavailable, leave a reviewed PR or committed fix and report that it is not deployed.
7. If a finding is unclear or the fix needs a material product decision, record a specific issue and recommendation. Do not invent a defect to justify a daily code change. A well-evidenced clean review is a valid outcome.

## Authority and limits

The user authorizes routine, reversible defect fixes and small improvements within the existing product. Do not add a confirmation request for every ordinary repair.

Do not change prices, free allowances, identity requirements, certification availability, seat-transfer rules, customer permissions, ownership, security settings or billing policy without the needed decision. Do not require an email before the free tutor merely because it improves lead capture. Do not alter real customer records or question identities, delete data, send customer email, submit official records or make a payment as part of this audit.

The inconsistent anonymous tutor quota observed on 2026-10-16 remains an open issue until directly rechecked. Changing IP-derived identities is one possible fix, but the exact production proxy chain was not inspected. Treat rotating proxy hops as a hypothesis, not a proven infrastructure diagnosis. Preserve the existing allowance and sign-in policy while investigating. Do not quietly launch a new email gate.

Use read-only production queries through `activeScriptConnection()` with `DATABASE_CUTOVER_USE_EXTERNAL_TARGET=true`. Never use raw `DATABASE_URL` for production figures. Keep secrets, real addresses, billing identifiers and customer-level evidence out of the public repository. Use `@echelon.test` fixtures.

Keep each run bounded. Aim to finish the daily baseline and one useful deep review in about an hour. Prioritize urgent verified defects over completing a cosmetic quota. Record unfinished checks and the next action rather than looping indefinitely. Do not silently turn the schedule off after failure.

## Evidence, history and report

Persist dated JSON, command logs and browser evidence outside the public source tree, under `/home/ubuntu/reviews/daily-audit/`. Record failures, warnings, skips and blocked checks separately. A test that only passes on retry stays a flaky-test warning. A command crash or unparseable result must not become a pass.

Track unresolved defects with stable GitHub issue links where appropriate. Search for an existing issue before creating another. Update the same issue as it is repaired. Avoid copying private customer details into issues. Log one dated Notion session entry for the run under the AI Context Hub; include the starting/final commit, actual coverage, findings, fixes, deployment evidence and unresolved items. Do not rewrite the large Hub main page.

Send father a concise but complete summary:

- What was actually checked, including the day's deep area and important coverage gaps.
- Verified bugs and product defects found, with their user or business impact.
- What was fixed or improved, the regression test, exact commit and whether it is live, in a PR, or only local.
- What remains open or requires a decision. Do not present suspected causes as facts.
- Evidence and next action. If nothing was found, say so without claiming the whole product is perfect.
