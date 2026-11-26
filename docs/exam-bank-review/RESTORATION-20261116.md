# Owner-authorized Claude correction restoration — 2026-11-16

This follow-up corrects the release tooling's unnecessary additional holds. The owner accepts the existing Claude review at `7730062d4d0cfcccbca17560211c45f9e76e366c`; no new content generation, research, or second content review is required. Missing in-content authority links and fewer than two worked steps are not blockers under this narrowly scoped policy. Existing application approval policy is not globally weakened.

The immutable original release remains historical evidence: 1,805 actions, comprising 1,145 approvals, 626 holds, and 34 rejections. Its plan digest is `f5134c73ee5a2b3b7c28d439017ccce76f44707a1de26a0afee02273ab5ed08f`. Its files and snapshot namespace must not be overwritten.

## Exact follow-up scope

The dedicated `scripts/exam-review-restoration.mjs` command restores only the 604 original holds outside the explicit source-check ID set. All 22 existing explicit holds, all 34 rejections, and all 1,145 existing approvals are excluded. Missing source marker 186086 remains unresolved and is never assigned to another question. After successful application the original population will comprise 1,749 approvals, 22 holds, and 34 rejections.

All question text, four distinct options, answer keys, and explanations come verbatim from the pinned review. Metadata including `isCalc` and source fields is unchanged. Only 43 step payloads require schema normalization: complete string steps become `{l: 'Step n', c: originalString}`; substantive label-only steps or labels with an empty body become `{l: 'Step n', c: originalLabel}`. Already canonical steps are retained. Exact Unicode, whitespace, sequence, and all substantive text survive. Null or short steps are not expanded with invented calculations. Unknown schemas fail closed.

## Safety and operation

The default CLI performs SELECTs only against the authoritative external database using CA-verified TLS. It verifies all 1,805 original immutable receipts and compares all 1,805 current rows with original after-images before producing a private plan and new encrypted backup. A dry run verified exactly 604 eligible actions, 43 normalizations, and zero conflicts. Artifacts are outside Git at `/home/ubuntu/outputs/exam-review-restoration-20261116`.

The transaction engine is reused with an explicit second release-key registry entry, `exam-review-restoration-20261116`. Before opening the write transaction, the complete restoration plan is rebuilt from the pinned review and authenticated original plan and must match exactly. There is no arbitrary release-key opt-in or validator bypass. Locked current rows must match all planned before-images; writes and separately namespaced snapshots commit atomically and after-images are verified. Any drift, partial state, receipt mismatch, or write failure aborts. Idempotent reapplication and exact rollback preserve immutable receipts.

Production application and backup-key escrow belong to the parent release owner. The new backup key must be moved to independent private escrow before applying. Both apply and rollback require `--plan` and its exact canonical `--confirm` SHA-256. Restart the application afterward to invalidate in-memory question caches; no bank metadata is changed. This change makes no application/runtime, schema, dependency, payment, learner-history, or user-account modifications.

## Validation

The original nine guarded release tests remain unchanged and passing. Nine new portable tests exercise the entire reviewed dataset, exact text preservation for all 43 normalizations, explicit exclusions, unknown-format rejection, drift handling, and unregistered-policy rejection. Both suites run in CI with the mandatory safety preload and no inherited database credentials. Private rehearsal of the actual pinned production plan additionally verifies all 604 updates, separate receipt namespacing, idempotence, exact rollback, repeated rollback, mid-write failure atomicity, drift rejection, and content-tamper rejection using an in-memory SQL double, not production writes.
