# 309A Flashcard Progress Display Audit — 2026-08-17

## Reproduction

The live 309A flashcard workspace initially shows 400 concept cards with `0 secure · 400 to review`. The shared flashcard shell calculates those counts from the currently rendered deck rather than the selected study scope.

## Root cause

When a learner selects the still-learning review mode, the rendered deck is intentionally reduced to only unknown cards. Because the header reuses that reduced deck for both counts, the displayed secured count falls back to zero even when the learner has already marked cards as known. This makes progress look as though it was reset. The current state also preserves number and string IDs as distinct Set values, which can make restored progress unreliable when an older save uses a different serialized ID type.

## Required correction

Calculate `Got it` and `Still learning` from the selected module’s full conceptual scope, not the temporary review deck. Normalize persisted card IDs to one stable representation before all membership checks. Keep session-completion counts explicitly scoped to the cards studied in that session.
