# PR 63: selective release and actual AI review evidence

## Release decision

The owner accepts AI content review rather than requiring expert sign-off. This change removes the provisional blanket hold, retains the actual question/key/explanation repairs, and withholds only 125 exact OIT addition IDs documented with reasons in `server/interactiveContent/engine/releaseExclusions.json`. It does not create a new approval architecture or claim human technical, regulatory or safety assurance.

Of 675 OIT additions, 550 remain available. All 340 other additions and all 124 bound replacements remain available. The independently pinned 671-item reviewed corpus, its approval declarations, all frozen legacy source packages and compiler pins are unchanged. No new questions or concepts were generated. Existing Cause and Effect calculation exclusions remain unchanged.

## What was really reviewed

Saved direct `gpt-6.1-sol` requests and raw responses cover all 675 OIT additions. The initial results were 407 `no_material_issue_found` and 268 `issue`; those 268 are broad AI findings, not 268 proven defects. Repairs retained 88 favorably reviewed current revisions in total; exact-current reconciliation records 484 favorable and 191 issue verdicts. Many remaining findings concern duplication, introductory simplifications or unstated assumptions rather than incorrect answers or unsafe directions. Those findings do not automatically withhold every affected item.

For the other 464 exercises (340 additions and 124 replacements), saved reviews of the exact current exercise and course return `issues: []`. Replacement requests also include the original ID, payload/hash and keyed-label context. This is a genuine favorable result under prompts asking for issue arrays; absence of a separate explicit verdict string is not a reason to reject that review. Of these 464, 59 received later full-entry re-reviews; the original requests for 405 did not supply topic/difficulty and historical metadata. No exact-current response contains an issue observation. Metadata is not itself a receipt.

Four important corrected replacements have later Sol empty-issue responses in `other-repair/rereview.sqlite3`:

| Current exercise | Request ID | Reviewed exercise canonical SHA-256 |
|---|---|---|
| class2-ww-032-r1 (filtration outside SBR phases) | req_0e76b45fab6848979564e6481fa213aa | 34e6c17cfb0bac2fd0a27abaf8007b542cfb6ecc003072783bd60f1bdab0a1bd |
| class1-water-068-r1 (universal filtration claim) | req_bc461215689a42ba9906c64e2597b3ea | 4732b1819d179551094ed058a417b7a909eed746f576c08df4fb35507f0be4f4 |
| class1-wastewater-coll-040-r1 (CCTV versus motor insulation) | req_e7a41616f7e14178adc191f0cee0572d | b025f3368a7325699cb5cb4ffaca4a20b1ea21a0a2b9a9c80eef345f718c5e66 |
| class1-wastewater-coll-045-r1 (wet-well explanation) | req_b05af0ff06aa466a96540d1edddc3622 | 06ea02b08bf69101462e8d9f803fea8ca581f7859f9b4dfe59da4c1aff6c0490 |

Their historical reviewer and date are preserved; notes now truthfully mention the subsequent Sol review. These notes are documentation changes, not a claim that Sol reviewed the new note text. No learner payload changed during this selective-release pass.

Private evidence is retained outside the repository under `/home/ubuntu/outputs/pr63-readiness-20261113`: `content-review`, `repair-round5/REPORT.md`, `reconciled-evidence.json`, `non-oit-reconciled.json` and the associated request/receipt files and read-only local ledgers. No raw private receipts are published in client assets. The offline aggregate audit and five negative tests validate original receipt coverage, request IDs, input binding and stale-payload detection; that audit is not an approval registry.

All reviewed source statuses remain **unverified**. Provider records are saved local evidence, not cryptographic provider attestations. No expert review, exhaustive source validation, exhaustive bank-wide semantic deduplication or jurisdiction-wide assurance is claimed. Earlier reports demanding explicit verdict wording, a 301-item hold, all-overlay withholding or expert sign-off are historical proposals superseded by this owner-authorized selective decision, not current delivery rules.

## Why these exact exclusions

The JSON lists each exact course/mode/ID, group and reason. There are 110 before-after, seven speed-match, six odd-one-out, one tap-the-flaw and one cause-effect exclusions. Procedural families are withheld conservatively where full scenario and site procedure are missing: routine sample collection, equipment-failure response, pump maintenance, confined-space entry, filter backwash, chemical spills, safety reporting, coliform follow-up, chemical-feed startup/setup and turbidity-incident diagnosis. Limited ambiguous filter/membrane cycle comparisons are also withheld; corrected, scoped cycle items stay available.

Specific additional exclusions cover incomplete atmosphere/PPE control boards, a mechanical first-check framing without isolation, unqualified DBP contact/disinfectant changes, storage reduction without reserve/pressure limits, pump throttling without pump type, a wrong nitrification mechanism, non-unique matching boards and the incorrect elevation-head definition. This is narrower than withholding every AI issue verdict or every member of earlier inventories. The corrected confined-space test/result-recording dependency `og-oit-b2-before-after-0134`, corrected hazardous-energy statement, corrected sample-bottle item and corrected DBP/bromate question remain available.

Excluded procedural items may be revised later under an explicit scenario and review, but are not blockers for delivery of the unaffected pool. Duplicated PPE recognition and polarity-reversed facts remain editorial improvements, not release blockers. No outstanding demonstrated unsafe/wrong item identified in this pass is intentionally delivered.

## Serving and version behavior

Catalog and paid sessions use the same effective pool. The pool checks replacement target hashes, substitutes corrections and applies exact-ID exclusions before appending allowed additions. Fixed previews serve their bound correction when present, never the defective original; a safety-excluded fixed preview returns zero rather than rotating to unrelated content. Historical calculation previews remain unchanged because their mode-fit restriction only applies to the paid pool.

Legacy compatibility remains bounded to original legacy slots: it applies those same bound corrections and safety exclusions, never imports additions or the v2 reviewed bank, and never silently falls back on a stale replacement target. Stored source bytes stay untouched. Catalog/session identities bind base public identity, course overlays, exclusions and presentation/selection behavior without exposing private checked manifest fingerprints. The client refreshes catalog/session once on a release mismatch and then fails closed if disagreement persists; manual retry, mode and identity changes get independent budgets.

The source builder no longer invents reviewer metadata. It produces unreviewed draft objects and refuses publication or overwriting committed content, including `--check`, until actual review is supplied through a future deliberate authoring action. Older authoring tables do not have stable-ID parity with reviewed overlay fixes and must not be regenerated over them.

## Validation

Credential-free `env -i` commands preload `scripts/test-safety.cjs` before Node test or TypeScript tooling; no production database or broad server suite is used. Engine/compiler/overlay/receipt/delivery regressions: 166 passing. Client browser/session/layout plus shared contracts/schema: 237 passing. Offline original-receipt audit: five passing. Both application and scripts TypeScript projects pass. Tests run serially to avoid the sandbox inode limit. Build and exact local commit are reported in the external implementation status after the committed production build; no push, merge or deploy occurs in this implementation task.
