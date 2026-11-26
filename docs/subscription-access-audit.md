# Subscription Access Audit — Class 1 Ontario (Matt's Journey)

Date: June 3, 2026

## Matt's Journey Step-by-Step

### Step 1: Landing page → /pricing → Checkout
- ✅ Works. `createSubscriptionCheckout` creates Stripe session with `subscription_data.metadata`

### Step 2: Stripe redirects to /subscription-success?session_id=xxx&tier=class1&province=ontario
- ✅ Fixed. `verifySubscriptionSession` confirms payment server-side
- ✅ `writeSubscriptionAccess()` writes to localStorage:
  - `echelon_subscription_exam_types` = `["oit","oit-ww","class1-water","class1-ww"]`
  - `echelon_trial_unlocked` = `"true"`
  - `echelon_trial_email` = customer email

### Step 3: Redirects to /quiz (OIT practice)
- ✅ `useQuizSession({ examType: "oit" })` → `isSubscriptionUnlocked("oit")` → true
- ✅ No gate fires, unlimited questions

### Step 4: Navigates to /class1-water (Class 1 Water practice)
- ✅ `useQuizSession({ examType: "class1-water" })` → `isSubscriptionUnlocked("class1-water")` → true
- ✅ Questions load from bank `class1-water` (DB has this bank)

### Step 5: Navigates to /class1-ww (Class 1 Wastewater practice)
- ✅ `useQuizSession({ examType: "class1-ww" })` → `isSubscriptionUnlocked("class1-ww")` → true
- ✅ Questions load from bank `class1-wastewater` (different key for DB, but that's fine — the quiz page uses `useQuestionBank("class1-wastewater")` separately)

### Step 6: Clicks "Mock Exam" → /class1-water-mock
- ✅ Fixed. `PurchaseGate examType="class1-water"` → `isSubscriptionCovered("class1-water")` → true
- ✅ Questions load from bank `class1-water`

### Step 7: Clicks "Mock Exam" → /class1-ww-mock
- ✅ Fixed. `MockExamShell productKey="class1-ww"` → `PurchaseGate examType="class1-ww"` → `isSubscriptionCovered("class1-ww")` → true

### Step 8: Clicks "Flashcards" → /class1-water-flashcards
- ✅ Fixed. `PurchaseGate examType="class1-water"` → `isSubscriptionCovered("class1-water")` → true

### Step 9: Clicks "Flashcards" → /class1-ww-flashcards
- ✅ Fixed. `PurchaseGate examType="class1-ww"` → `isSubscriptionCovered("class1-ww")` → true

### Step 10: AI Tutor (on any question)
- ✅ No access gate on AITutor component. It renders inside the quiz/mock shell which is already gated.

### Step 11: Formula sheets → /formulas-water1, /formulas-ww1
- ✅ No access gate on formula pages. They are freely accessible.

### Step 12: Score History
- ✅ No access gate on ScoreHistory component. It renders inside gated shells.

### Step 13: OIT Mock Exam → /oit-mock
- ✅ `PurchaseGate examType="oit"` → `isSubscriptionCovered("oit")` → true

### Step 14: OIT Wastewater Mock → /oit-ww-mock
- ✅ `PurchaseGate examType="oit-ww"` → `isSubscriptionCovered("oit-ww")` → true

## Edge Cases

### New browser / cleared localStorage (not logged in)
- ❌ All localStorage checks fail
- ❌ `checkAccess` returns false for unauthenticated users
- ✅ Recovery path: go to /account → enter email → Restore Access
- This writes `echelon_subscription_exam_types` back to localStorage

### Logged in user on new device
- ✅ `checkAccess` server query finds subscription in DB → returns `hasAccess: true`
- ✅ `useQuizSession` lifts gate via useEffect
- ✅ `PurchaseGate` also calls `checkAccess` when authenticated

## Access Gate Summary

| Component | Checks localStorage subscription? | Checks server (auth only)? |
|---|---|---|
| QuizGate (via useQuizSession) | ✅ isSubscriptionUnlocked | ✅ checkAccess |
| PurchaseGate | ✅ isSubscriptionCovered | ✅ checkAccess |
| AITutor | N/A (no gate) | N/A |
| FlashcardShell | N/A (wrapped in PurchaseGate) | N/A |
| MockExamShell | N/A (wrapped in PurchaseGate) | N/A |
| Formula pages | N/A (no gate) | N/A |
| ScoreHistory | N/A (no gate) | N/A |

## Conclusion

All features work for Matt's subscription after the two fixes:
1. QuizGate now checks `isSubscriptionUnlocked(examType)`
2. PurchaseGate now checks `isSubscriptionCovered(examType)`

The only scenario where Matt would hit a wall is if he's on a completely fresh browser without localStorage AND is not logged in — in that case he uses /account Restore Access.
