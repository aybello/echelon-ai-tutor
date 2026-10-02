# Echelon visual restoration draft

## Direction

Father's instruction on October 2, 2026: restore the old site design, then apply useful elements of the newer design across Echelon. The simpler quiz pages are explicitly liked. This means old visual identity plus improved usability, not a full application rollback or a new third style.

## Baseline and assets

- Inspected main and GitHub main: `3899c3b31e7d182917dd425c37c75ba008edebbe`.
- Old visual baseline before PR #120: `13ae4d5e3260907730681671bd8a67915e0b0ff9`.
- Original Echelon icon: `https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_5c9ed3a7.webp`.
- Existing Sora font loading: `client/index.html`.
- Old shared visual tokens: `client/src/index.css`, navy #0b1f3a, blue #1d4ed8, teal #0f766e, white cards and slate #f4f7fb canvas.
- Existing layout improvement layer: `client/src/components/StudyWorkspace.css`.
- PR #120 visual layer to replace selectively: `client/src/styles/StudyDesign.css`.

## Preservation contract

Mode: Redesign, preserve. Brand fidelity 10/10, visual variance 2/10, motion 2/10, density 6/10, asset dependence 3/10.

Preserve the following newer usability improvements:

- Shared practice shell, simpler header, one main question action, collapsible practice options, optional confidence, accessible touch targets and readable answers.
- Topic modules, study notes, formula links, AI Tutor, reports, bookmarks, timing, answer feedback and existing question-bank behavior.
- Course finder and its correct province/system/level mapping.
- Learner's recommended next step, manager roster filters and separate reporting.
- Collapsible mock navigator and clearer mobile controls.
- CEU overview/lesson/assessment flow, public read-only preview, protected submissions, measured shell geometry, lesson view scroll-reset and non-credit disclosures.
- CAD checkout enforcement, prices, payment behavior, access terms, activation-precision repair, analytics, authentication, server, schema, customer data and routes.

Restore the old visual identity: original logo, Sora headings and body, familiar blue/teal/navy accents, white rounded cards, slate backgrounds and original homepage hero. Remove the competing ivory/sage/brass palette, serif headings and decorative replacement hero. Keep useful new controls within the old style.

The founder-admin redesign predates PR #120. Its functions and sidebar must not be reverted blindly. Site-wide admin visual alignment will be addressed after the early draft is approved.

## Draft boundary

Show a viewable unpublished draft using actual React components and clearly labelled fictional fixture data before a wider release. No production records, publishing or checkout operations in this draft. Do not claim the entire site has been redesigned or production restored from this early preview.

The comparison should include the restored homepage, simplified practice page, and the existing pricing page so father can judge visual continuity. Other fixture-backed learning screens can be inspected in the same preview.
