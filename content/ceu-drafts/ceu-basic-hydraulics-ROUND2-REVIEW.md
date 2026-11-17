# Basic Hydraulics CE draft: round two, Opus re-review

Draft: `content/ceu-drafts/ceu-basic-hydraulics.json` (round two, the version on `claude/hello-5oz7m4`). This pass changed two table cells and nothing else. Ids, `correctIndex` values, check and final counts (6/6/6/6 checks, 5/5/5/5 final, 5/5/5/5 alternate final) and module structure are unchanged.

Round one's record is in `ceu-basic-hydraulics-REVIEW-RESULT.md`. This file covers round two only, including the five topics added in round two: hydrostatics, static head, priming at recognition level, pump types and wastewater valves.

## Method

- Review copies were built from the round-two draft with 14 planted errors (one wrong key or altered number per unit, including the five added topics). The planted list is in the scratch folder, not in the repo.
- Opus reviewed the planted copies, one reviewer per module (four modules).
- Planted errors were checked as caught or missed. Planted "fixes" were never applied to the draft.
- Each non-planted finding was checked against the real draft text before any change was made.

## Result

- Planted errors: 14 of 14 caught.
- Real defects fixed: 1 (see below).
- Precision edit: 1 (see below).
- Not applied: six notes (listed below). One of them (final question f5) could affect fairness.

## Changes made

1. **Pump table, rotary lobe row** (operating-problems). The row read "Two synchronized lobed rotors carry liquid between the rotors and the casing and carry liquid around", with the carrying phrase repeated and garbled. Now: "Two synchronized lobed rotors carry liquid in pockets between the rotors and the casing." This is a text error.
2. **Valve table, mud row** (operating-problems). The row said "Gate-type valve at a tank or basin floor". A mud valve on a tank floor is often a gate valve or a plug valve, so the row now says "Valve, often a gate or plug valve, at a tank or basin floor that drains settled sludge by gravity." This is a precision edit, not a factual error. The reviewer's alternative ("plug/disc valve") was not used because it is no more standard than either.

## Not applied (notes from the Opus pass, not verified line by line in this pass)

- Pump table, screw row: does not mention the Archimedes screw. Optional addition.
- Troubleshooting table: "clogged impeller" listed as a cause of low flow in a debatable way. Left as is.
- Flow-velocity lesson: "four common flow units" lists gallons as a unit alongside the flow units; gallons is a volume. Wording only.
- Flow-velocity: rounding notes on questions a1, a5 and c5.
- Operating-problems final question f5: two answer choices read as near-duplicates. This could make the question unfair. Needs a human look before the next round.
- Friction-pumps: affinity-law wording could be read two ways. Left as is.

The f5 near-duplicate is the one item that could affect fairness. It is open.

## Not done in this pass

- GPT-6.1 Sol and Gemini were not run on round two in this pass. Round one's planted-error results are in the round-one review file.
- No live app check. The draft is not published; `server/ceu/courses/` and the catalogue are unchanged.
