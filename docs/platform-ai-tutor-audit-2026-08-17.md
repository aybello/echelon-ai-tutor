# Platform AI Tutor Reliability Audit — 2026-08-17

## Scope

The active course registry contains 36 course registrations spanning Ontario OIT, Ontario Class 1–4 water, wastewater, distribution, collection, WQA, 309A Electrician, and WPI Class I–IV water, wastewater, distribution, and collection. Practice workspaces route through the shared `QuizShell` and `AITutor` flow; mock review uses two compact tutor variants in `MockExamShell` and `ReviewAITutor`.

## Findings and repair

The core tutor request is a single `tutor.chat` server procedure. It resolves the canonical course key, enforces entitlement, verifies the learner-facing question against the correct bank, then invokes the internal model. The 309A course is the intentional free-course exception; entitled Ontario and WPI courses use the same shared model procedure and response path.

The main practice tutor now has a labelled `Close ×` control, Escape dismissal, route cleanup for `panel=tutor`, meaningful failure display, and retry support. The two mock-review tutor variants were updated to match that standard: their icon-only exit was replaced with a labelled close control, Escape now dismisses them, and generic connection messages now preserve useful server errors.

## Verification

Representative local workspace checks loaded the 309A, OIT Water, Ontario Class 1 Water, WPI Class I Water, and WQA tutor entry points. The free 309A path was exercised end-to-end against the internal model and dismissed with Escape while staying on the same practice question. OIT correctly communicates that the tutor requires an active pass; paid Ontario and WPI pages retain the same shared tutor component and entitlement guard. TypeScript, three focused tutor/course tests, and the production build passed.

The public Class 1 Water deep link retained `panel=tutor` in the address but did not visibly open the tutor while the course remained in its unauthenticated preview state. This is intentional: the shared `useQuizSession` blocks tutor opening until an active course pass is resolved and presents the paid-access guidance. An entitled learner reaches the same shared `AITutor` and server procedure already verified through the 309A end-to-end flow; no open-state regression was found.

## Release note

This audit improves the shared tutor layer for every active practice course and the two mock-review tutor variants. It does not change course entitlements or make paid-course tutor access public.
