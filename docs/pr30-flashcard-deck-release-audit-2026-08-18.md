# PR #30 Flashcard Deck Release Audit — 2026-08-18

## Initial public verification

The merged main branch rendered the expected 200-card deck locally, with complete prompts. The first cache-busted production check after checkpoint `7e646755` still served the prior 400-card client bundle with truncated scenario cues and the old `Decision check` label.

## Required follow-up

Force a fresh production publication snapshot, then confirm the public route reports 200 cards and exposes the complete-prompt `What is the best response?` deck.

## Final public verification

The forced publication succeeded. The cache-busted public route now displays `200 cards`, `0 got it · 200 still learning`, and `Review 200 still-learning`. The card front uses the full governed scenario and `What is the best response?` heading; the back displays the approved answer, full explanation, and key takeaway.
