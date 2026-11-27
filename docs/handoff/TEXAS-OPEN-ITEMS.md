# Texas: open items (tracked so nothing is lost)

Last updated 2026-11-27. Texas is NOT finished. Work these in order.

## 1. Wastewater Class C bank (tx-wastewater-treatment-c, Narrow)
- Branch: claude/us-bank-tx-wastewater-c-v2 (commit 09c214eec). Giveaway rewrite was running (GPT only) and is not yet committed.
- Still to do: GPT review of the rewritten rows; record in REVIEW-RESULT.md; confirm final commit.
- Owner approved release on 2026-11-27, against the version with the giveaway rewrite. Manus must use the latest commit.

## 2. Wastewater Class D bank (tx-wastewater-d, Narrow)
- Branch: claude/us-bank-tx-wastewater-d (commit 73f2ada7). Pushed.
- Still to do: giveaway pass (same process as Class C), then GPT review of changed rows.
- Owner approved release on 2026-11-27. Manus must use the latest commit.

## 3. Wastewater Classes B and A: NOT COVERED
- The Texas dossier covers only Class D and Class C.
- TCEQ pages for Class B and Class A were only partly read. Class A's entry only points to the licensing homepage.
- Next step: read the TCEQ Class B and Class A need-to-know pages, extend docs/us-launch/state-dossiers/tx-operator-certification.md, and decide the rating. Then decide whether to build banks.

## 4. Water classes C, B and A: NOT COVERED
- Only the water Class D page was read in full.
- Next step: read the TCEQ water Class C, B and A pages and extend the dossier the same way.

## 5. Collection system classes (I, II, III): NOT COVERED
- Only partly extracted. Decide whether they're in scope.

## Rule for this state
A state is complete when every level and stream we can verify has a bank, and each gap is recorded with a reason. Texas stays open until items 3 to 5 are resolved.
