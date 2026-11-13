# Question 522 and 650: offline governed correction support

This package **does not connect to a database, execute SQL or support `--apply`**. Do not use the OIT-specific revision writer for these banks. It is review support, not evidence that production is repaired.

- `class3-water/522`, existing row `240651`: replace option 0 with **76.7 mg/L** (same key index), replace the explanation and complete dimensionally correct steps. `(8,000 × 100 + 4,000 × 30) / 12,000 = 76.6667 mg/L`. Preserve the stem, bank and question identity. Do not recalculate historical attempts silently.
- `wpi-class4-water/650`, existing row `300022`: repair **only** the misplaced closing quote in worked-step JSON. No substantive claim, option, key, stem or explanation change is proposed.

## Review and release gate

1. A separately authorized operator obtains a private, current snapshot with exactly the fields in `scripts/content/public-question-corrections-20261017.json`, including raw serialized strings and review status. This task made no production reads or writes.
2. Run offline: `node scripts/content/plan-public-question-corrections.mjs /private/snapshot.json`. Every stored expected field must match exactly; any drift, duplicate or missing row aborts. Review the plan digest and the full before/after content. The embedded expected snapshot came from the supplied October 16 evidence; the October 17 executive audit confirmed the same defects, but a fresh version check remains mandatory.
3. Obtain technical/content approval and a correction record that distinguishes pre-correction scoring. A parent-owned bank-appropriate writer must lock and compare the exact version, write durable before-image/revision provenance, update the existing IDs in one transaction, invalidate affected bank content versions and reconcile visible counts, validate post-images, and roll back on mismatch. No such writer or production authorization is supplied here.
4. Preserve all learner attempts/history. Release with a separately reviewed historical-treatment decision; do not silently relabel old correct/incorrect outcomes. Neither row is promoted to approved by this package, nor is missing source/objective metadata invented.

Pending: domain approval, current exact-version snapshot, bank-appropriate durable revision writer/record, historical scoring decision, controlled release and live verification. This is intentionally not a production mutation script.
