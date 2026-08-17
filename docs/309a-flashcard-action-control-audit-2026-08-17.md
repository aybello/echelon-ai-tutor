# 309A Flashcard Action-Control Layering Audit — 2026-08-17

## Finding

The flipped card face was able to grow over the learner decision controls. On cards with fuller explanations, `Still Learning` and `Got It!` could appear visually behind the transformed card and could not be reliably selected.

## Correction

The card now uses a stable responsive height with internal scrolling for longer revealed content. The action row has a protected foreground stacking layer and dedicated spacing beneath the card, so learner decisions never sit underneath the transformed flip surface.

## Verification

The revealed 309A card was inspected locally after the correction. Both `Still Learning` and `Got It!` were visibly rendered beneath the back face as independent foreground buttons, with the navigation controls below them. TypeScript and focused flashcard layout, progress, and projection tests passed.
