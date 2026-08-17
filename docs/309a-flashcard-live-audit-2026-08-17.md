# Ontario 309A Flashcard Live Audit — 2026-08-17

## Source

- Live URL: https://echeloninstitute.ca/electrician-309a-flashcards
- Verified after the promoted 309A v3 governed-bank release.

## Learner-facing findings

- The page loads 400 non-calculation cards and exposes the expected course sub-navigation plus module chips.
- The front of each card is the full, long-form assessment question, often a multi-sentence scenario rather than a concise concept prompt.
- The back shows the correct option followed by the complete long-form question explanation. This makes cards text-heavy and does not create a distinct flashcard learning unit.
- The primary interaction does not surface a clear concept label, concise answer, key takeaway, or source-to-practice path.
- The shared shell supports known/unknown actions after reveal, but the header only displays a generic count and the default deck description does not clearly explain the review state or what a learner should do next.
- The initial live view showed a long transformer scenario rather than a compact transformer concept card, confirming the need for a 309A-specific card projection from governed question data.

## Improvement direction

Build a 309A-specific flashcard adapter that turns governed questions into concise concept cards, preserves a learner-actionable answer and takeaway, carries module/topic metadata, and keeps the existing shared shell’s module filtering and saved known/unknown progress.
