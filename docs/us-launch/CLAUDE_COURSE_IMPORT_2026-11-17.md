# Claude course package import — 2026-11-17

This is a selective, draft-only import onto main `53933da9c52847e02f2e024a36ea2881495dcb9d`, not a merge of either older application branch. The owner's existing AI content reviews are accepted; this import performs structural and integration checks, not another subject-matter review.

## Included packages

| Package | Imported source | Result |
|---|---|---|
| Basic Hydraulics | Hello `7aede45220a52e69bc1ecba4c138a71822996503` | Existing draft updated with five added topics and review fixes; four modules, 24 checks, 20 final and 20 alternate questions, seven SVG diagrams, cover image. |
| Basic Hydraulics round-two review | Gifted `7147b96f4eb85a874acc227a396ca5bcf7d80596` | Additional Opus review record retained without overwriting Hello's newer course JSON. |
| Basic Math | Hello | Existing reviewed draft updated with final-assessment wording and cover image; four modules, 24 checks, 20 final and 20 alternate questions, five SVG diagrams. The review result already on main is retained unchanged. |
| Basic Safety | Hello | New reviewed draft, notes and review result; four modules, 24 checks, 20 final and 20 alternate questions, five SVG diagrams and five photos (one cover and four lesson images). |
| Florida Level 3 distribution | Hello | Reviewed corrections to the existing 150-question package, including 36 calculations, plus review result. No increase in bank size or production import. |
| Florida Class C treatment | Gifted | New incomplete source draft: 76 of 150 planned rows, comprising 56 conceptual and 20 calculations. Source lint passes. No generated full bank, manifest, completed review, import or publication is claimed. |
| Authoring handoff | Hello | Session handoff, five course-brief documents, Safety gap report and five historical authoring/review tools. |

There are three course drafts after this import, but only Safety is a new course draft. Across the three: 12 modules, 72 checks, 60 final and 60 alternate questions, 17 SVG diagrams and seven JPEG assets. Hydraulics and Math question counts were already present on main and are not new questions.

## Intentionally not included

No changes to runtime course registration, public catalogue metadata, frontend assets or routes, Stripe products/prices, accreditation claims, migrations, environment flags, entitlements, live question tables, game content, analytics, memory loading or tutor behavior. The existing exam correction/release package remains unchanged. Pennsylvania queue rows retain main's reviewed-local status rather than the older source branch's stale progress text.

PR #248's separate Foundations registration work is not included. The source handoff explicitly treats registration as separate. Safety's `/ceu-covers/` lesson paths map to the supplied draft assets under `content/ceu-drafts/covers/`; they are not claimed to be publicly deployed. Any later course publication must integrate these assets and course metadata deliberately.

The imported handoff is a historical source document, not an instruction to undo newer main work or re-run completed content reviews. In particular, Gifted's round-two review record supersedes the handoff's older note about the unfinished Hydraulics Opus pass. The tools under `docs/handoff/tools/` retain source-session scratch paths and model configuration for provenance; only syntax was checked, and no model calls or screenshots were run. Adapt paths and verify current supported APIs before any later authorized use.

## Verification and release boundary

The import is checked for valid JSON, course contract fields, question IDs/options/answer-index ranges, module/source references, activity-minute totals, final-assessment activity wording, all 17 embedded SVG documents, all seven JPEG file signatures, supplied image references, and byte-for-byte source provenance. Existing US-bank tooling is used read-only: `check fl-water-distribution-l3` and `lint fl-water-treatment-c`.

Local test/build logs and the file-by-file source manifest are retained outside the repository in `/home/ubuntu/outputs/claude-course-updates-20261117/`. No production database connection or write is part of this release. Merging or deploying these repository files does not make the new course drafts or banks live learner courses.
