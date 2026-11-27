# Manus: stage the reviewed US state exam banks (not published)

Owner instruction: prepare a pull request against `main` with the reviewed state banks. Do not import into any database, do not turn on learner access, and do not merge or deploy without the owner's written approval.

Read first: `docs/us-launch/US_STATE_PRIORITY_2026-11-16.md`, `docs/us-launch/US_BANK_QUEUE_2026-11-16.md`, `docs/us-launch/US_STATE_QUESTION_BANK_READINESS_2026-10-29.md`.

## What to stage
Banks already in the repo under `content/us-banks/` on `main`, each with `config.json`, `manifest.json`, `questions/bank-<n>.json`, `source/`, and a review record:

| Bank folder | Questions | Review record |
|---|---|---|
| `ca-wastewater-collection-csm1` | 295 | `REVIEW-RESULT.md` |
| `ca-water-distribution-d1` | 250 | `REVIEW-RESULT.md` |
| `ca-water-treatment-t1` | 280 | `REVIEW-RESULT.md` |
| `pa-wastewater-collection-e4` | 250 | `REVIEW-RESULT.md` |
| `pa-class-e-water-distribution` | 500 | `REVIEW-RESULT.md` |
| `fl-water-distribution-l3` | 150 | `REVIEW-RESULT.md` |

Do not stage `fl-water-treatment-c`. It is incomplete (76 of 150) and unreviewed.

Make sure all six bank folders are in the PR. If one is missing on `main`, copy it from the branch that holds it and note the copy in the PR.

## Steps
1. Create a branch from `main`, for example `manus/state-banks-stage-1`.
2. Confirm each bank folder's `manifest.json` checksums match its question file. Record the result.
3. Find the repo's existing bank import and validation tooling (search for the importer that reads `content/us-banks/`) and use it as-is. If you cannot find one, note that in the PR and continue with the checks you can run.
4. Run the validator in dry-run mode on all six banks. Dry run only: no database writes. Paste the output into the PR.
5. Run the bank-related tests (for example `client/src/pages/USStatePage.coverage.test.ts` and the `us-banks` tests, using the repo's test wrapper). All must pass. Paste results into the PR.
6. Confirm learner access stays off: the banks must not appear in the public catalogue or any learner list until the owner approves.
7. Open a PR against `main`. Title: "US state banks: stage six reviewed banks (not published)". The body must list, for each bank: question count, review record, and the dry-run result. Note the Florida water distribution bank's review did not compare against the dossier. Add that the Florida water treatment draft is excluded.


## Owner approval (2026-11-27)
The owner approves importing and publishing these three banks, once the dry run in step 4 passes:
- `ca-wastewater-collection-csm1` (295 questions)
- `ca-water-distribution-d1` (250 questions)
- `ca-water-treatment-t1` (280 questions)

Not yet approved: the Pennsylvania and Florida banks. Keep them staged only.

Manus: run the existing guarded import for the three approved banks, then release them to learners using the repo's normal release step. Record the import output and the release in the PR. If a check fails, record it and do not release that bank.

## Do not
- Do not publish, release or enable the Pennsylvania or Florida banks for learners.
- Do not merge the PR without the owner's approval in the PR thread.
- Do not change pricing, checkout, entitlements or access control.
- Do not edit the banks' questions. If you find a problem, list it in the PR with the question ID and continue.

## Report back
PR link, dry-run output, test results, and any bank that failed a check, with the reasons.
