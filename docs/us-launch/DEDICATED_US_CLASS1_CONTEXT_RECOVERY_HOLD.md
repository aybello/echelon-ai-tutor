# Dedicated U.S. Class I Context-Recovery Hold

**Status:** Held — no implementation, authoring, import, activation, publication, sales, or routing change is authorized.

**Recorded:** 2026-10-10

## What is known

- The current application contains two dedicated U.S. Class I product identities, routes, mock profiles, formula resources, and bank keys:
  - `us-class1-water`
  - `us-class1-water-dist`
- Git history records an October 8 sequence that deliberately created the dedicated product path:
  - `dba73972` scaffolded the dedicated courses as inactive with no content import;
  - `283a50f6` records import and activation of a **398-item** reviewed package: 200 treatment and 198 distribution questions, originally routed for Ohio and New Jersey;
  - `0cda199c` records that an initial import landed in a database the application did not read, then changed the content scripts to resolve the same external target as the application; and
  - `24a69551` records release of both dedicated banks into individual checkout after learner-visible inventory and mock-blueprint checks.
- A 2026-10-10 read-only check of this sandbox's selected managed database found no rows or `question_bank_meta` record for either bank key. The running local Echelon processes expose only `DATABASE_URL`, not the external-target selector or external database credentials, so this check cannot query the database target named in `0cda199c`.
- The shared WPI Class I banks do contain question records, but they are distinct products and must not be substituted for the dedicated U.S. banks without a separate, evidence-based product decision.
- The legacy importer points to `/home/ubuntu/outputs/echelon-us-integration-2026-10-08/us-class1-import-package.json`; that package is not present in the current workspace and was not committed to Git.

## What is *not* known

A zero-row observation in the currently attached database does **not** establish any of the following:

- that the dedicated U.S. banks were abandoned;
- that they were never authored, reviewed, imported, or intended for a later release;
- that their source package is unrecoverable;
- that the attached database is the same environment that held a prior staged or released package; or
- that shared WPI banks should replace the dedicated U.S. product path.

No code, routing, pricing, product availability, public copy, checkout behaviour, or database state may be changed on the basis of that observation alone.

## Required context recovery before any further action

Recover and reconcile the original decision record from, in order:

1. GitHub history, pull requests, tags, release/checkpoint records, and package manifests relating to the dedicated U.S. Class I work;
2. the prior Manus account/project workspace and any transferred encrypted database or output archives, including the missing `echelon-us-integration-2026-10-08` package and release-result records;
3. the external authoritative database referenced by `0cda199c`, using its own authenticated environment and **read-only** counts/statuses for the two bank keys and their metadata;
4. the AI Context Hub and any project decision notes; and
5. the product owner's intended release decision.

The recovery record must answer:

- What problem were the dedicated U.S. banks created to solve?
- Were 200 treatment and 198 distribution questions already drafted, reviewed, staged, or released elsewhere?
- Which database/environment was expected to receive them?
- Was a shared-WPI fallback, coexistence model, or dedicated-only model intended?
- What release gates, source criteria version, commercial configuration, and state-specific positioning were approved?

## Resume gate

Work may resume only after the recovered evidence is written to a dated decision record and the product owner selects one of these paths:

1. **Recover and validate an existing dedicated package**;
2. **Continue the original dedicated-bank authoring/review program**;
3. **Replace the product design deliberately** with a separately approved shared-WPI model; or
4. **Retire the dedicated placeholders** with an explicit product/release decision.

Until then, all existing source dossiers and draft assignments remain planning artifacts only. No draft output has been produced and no learner, customer, payment, content, or database record has been changed.
