# Manus Build Brief — Free Diagnostic Test Funnel for Echelon Institute

## Goal

Build a free diagnostic test feature for Echelon Institute.

This feature should help Canadian water and wastewater operators quickly check their exam readiness, identify weak topics, and convert into paid Echelon users.

The diagnostic should become one of the main homepage and marketing CTAs.

Website:

```txt id="4mkdft"
echeloninstitute.ca
```

Primary CTA:

```txt id="egm7wz"
Take the Free Diagnostic Test
```

Secondary CTA:

```txt id="jn0dpw"
Try 15 Free Practice Questions
```

---

# 1. Product purpose

The diagnostic test should answer one question for the user:

```txt id="790cxf"
Am I ready for my operator exam?
```

It should answer one question for Echelon:

```txt id="xzqjlt"
What should this user study next, and how likely are they to buy?
```

This is not just a quiz feature.

It is a conversion funnel.

---

# 2. User flow

Build this flow:

```txt id="88xg4s"
User lands on Echelon
→ clicks “Take Free Diagnostic Test”
→ chooses exam type
→ answers 30 questions
→ sees basic score immediately
→ enters email to unlock full report
→ sees weak topics and recommended study plan
→ CTA to buy full access
```

Do not require account creation before starting the diagnostic.

Reduce friction at the beginning.

---

# 3. Diagnostic test structure

Each diagnostic should include:

```txt id="zlv23j"
30 questions
Exam-specific question sampling
Mixed difficulty
Mixed modules/topics
No instant answer feedback during the test
Final score at the end
Weak-topic breakdown
Recommended next step
```

Supported initial exams:

```txt id="cl6yh5"
OIT Water
OIT Wastewater
Class 1 Water
Class 1 Wastewater
Class 2 Water
Class 2 Wastewater
Class 3 Water
Class 3 Wastewater
Class 4 Water
Class 4 Wastewater
WQA
WPI Class I–IV where available
```

Use existing question banks.

Do not create a new question bank just for diagnostics unless necessary.

Sample from the existing banks.

---

# 4. Email capture behavior

After the user completes the diagnostic, show a partial result immediately.

Example:

```txt id="bdl3an"
You scored 52%.
You are getting close, but your diagnostic found weak areas.
```

Then ask for email to unlock the full report.

Email gate copy:

```txt id="l5doxz"
Enter your email to see your full breakdown:
- weakest topics
- readiness level
- recommended study plan
- what to practice next
```

Do not hide the entire result before email.

Show enough to build trust, then ask for email for the detailed report.

---

# 5. Score categories

Use these readiness labels:

```txt id="rgnklz"
0–49%: Not Ready Yet
50–69%: Getting Close
70–84%: Almost Ready
85–100%: Strong Readiness
```

## Result copy

### 0–49% — Not Ready Yet

```txt id="sanb71"
You may not be ready yet.

Your diagnostic shows that you need more focused practice before exam day. Start with your weakest topics, review explanations, and take a timed mock exam after more practice.
```

### 50–69% — Getting Close

```txt id="x0axid"
You are getting close.

You understand some of the material, but your weak areas could still cost you marks on exam day. Focused practice can help you improve faster than random studying.
```

### 70–84% — Almost Ready

```txt id="y7z29j"
You are almost ready.

Your score is promising, but you still have specific topics to tighten before exam day. Use mock exams and targeted review to close the gaps.
```

### 85–100% — Strong Readiness

```txt id="m8nqei"
Strong readiness.

You performed well on this diagnostic. Keep practicing under timed conditions and review any weak topics before exam day.
```

---

# 6. Full report

After email capture, show:

```txt id="0e5ssh"
Overall score
Readiness label
Correct answers count
Incorrect answers count
Weakest modules
Strongest modules
Topic breakdown
Recommended study plan
Recommended next action
CTA to buy full access
```

Example layout:

```txt id="tx8x70"
Score: 17/30 — 57%
Readiness: Getting Close

Weakest Topics:
1. Disinfection
2. Math & Calculations
3. Water Quality

Recommended Next Step:
Start with a 7-day focused practice plan, then take a timed mock exam.
```

---

# 7. Recommended study plan

Generate a simple study plan based on score.

## If 0–49%

```txt id="c5p8ia"
Recommended plan: 21-day foundation rebuild
- Review weak modules
- Practice 20 questions per day
- Use AI explanations
- Take a mock exam after 7 days
```

## If 50–69%

```txt id="3n9vop"
Recommended plan: 14-day focused improvement plan
- Practice weak topics first
- Review missed questions
- Take 2 timed mock exams
- Track readiness before exam day
```

## If 70–84%

```txt id="219bhf"
Recommended plan: 7-day exam readiness plan
- Review weak areas
- Practice mixed questions
- Take timed mock exams
- Use flashcards for final review
```

## If 85–100%

```txt id="pcw6df"
Recommended plan: final review plan
- Continue timed practice
- Review missed questions
- Maintain readiness
- Avoid overconfidence
```

---

# 8. CTA after report

The report should end with a strong CTA.

Example:

```txt id="pil5fh"
Ready to improve your score?

Unlock full access to practice questions, mock exams, AI explanations, flashcards, study notes, and readiness tracking.
```

Button:

```txt id="po1p8p"
Start Practicing With Echelon
```

Secondary button:

```txt id="u3r3e9"
View Pricing
```

---

# 9. Backend requirements

Create diagnostic endpoints under the existing API structure.

Suggested procedures:

```txt id="6zxzl7"
diagnostic.start
diagnostic.submitAnswer
diagnostic.complete
diagnostic.captureEmail
diagnostic.getReport
```

Or, if simpler, create:

```txt id="5avy4p"
diagnostic.getQuestions
diagnostic.submitDiagnostic
diagnostic.captureLead
```

All diagnostic question selection should happen server-side.

Do not allow the client to choose paid-only question sets in a way that bypasses access rules.

The diagnostic should only return the selected 30 diagnostic questions.

---

# 10. Data to store

Create a diagnostic results table if needed.

Store:

```txt id="4xb56e"
id
email nullable before capture
examType
bankKey
score
totalQuestions
correctCount
incorrectCount
readinessLabel
weakModules JSON
strongModules JSON
answers JSON
startedAt
completedAt
source
utmSource
utmMedium
utmCampaign
referralSource
convertedToPaid boolean if available later
createdAt
```

This data should help Echelon understand conversion.

---

# 11. Lead capture

When the user enters email, store:

```txt id="v0f1f1"
email
examType
diagnosticScore
readinessLabel
weakModules
source = diagnostic
utm data
```

This should feed into future email marketing.

Do not create duplicate leads unnecessarily.

If the email already exists, update the latest diagnostic result.

---

# 12. Email follow-up

Optional for first version, but prepare the structure.

After diagnostic completion, send an email:

Subject:

```txt id="yuwmtw"
Your Echelon Diagnostic Results
```

Email body should include:

```txt id="lxkgkp"
Score
Readiness label
Weakest topics
Recommended next step
Link back to report
CTA to start practicing
```

---

# 13. Frontend pages

Create:

```txt id="8yqkao"
/diagnostic
/diagnostic/:examType
/diagnostic/results/:resultId
```

Or equivalent.

## Diagnostic landing page

Headline:

```txt id="u5xtvl"
Find Out If You’re Ready for Your Operator Exam
```

Subheadline:

```txt id="qwpupb"
Take a free 30-question diagnostic and see what topics you should study before exam day.
```

CTA:

```txt id="e61f8o"
Start Free Diagnostic
```

## Exam selection page

Allow user to choose:

```txt id="omx8zc"
OIT
Class 1
Class 2
Class 3
Class 4
WQA
WPI
Water Treatment
Wastewater Treatment
Water Distribution
Wastewater Collection
```

Keep the first version simple.

---

# 14. Homepage integration

Add homepage section near the top.

Headline:

```txt id="wcsk4z"
Not Sure If You’re Ready?
```

Subtext:

```txt id="2pw01d"
Take Echelon’s free diagnostic test and find out which topics to focus on before exam day.
```

Button:

```txt id="idllqg"
Take the Free Diagnostic
```

Secondary button:

```txt id="v8iabw"
Try Practice Questions
```

---

# 15. Pricing integration

On pricing page, add a banner:

```txt id="8pj3ey"
Not sure which plan you need?
Take the free diagnostic first.
```

Button:

```txt id="midlvn"
Take Free Diagnostic
```

---

# 16. Admin dashboard integration

Add diagnostic analytics to admin later or now if simple.

Show:

```txt id="qkaj7l"
Diagnostic starts
Diagnostic completions
Average score
Emails captured
Most popular exam type
Weakest topics across users
Conversion to paid if available
```

This can be V2 if needed.

---

# 17. SEO and content usage

Make the diagnostic link the main CTA in blog posts.

Example CTA block:

```txt id="0zjzao"
Preparing for your operator exam?
Take Echelon’s free diagnostic test and see what topics you should study first.
```

Use on pages targeting:

```txt id="f6fgwg"
OIT exam practice questions Ontario
Class 1 Water exam prep
Wastewater operator exam practice
WQA exam prep
WPI exam prep
```

---

# 18. Important security requirement

The diagnostic is free, but it should not expose too much paid content.

Rules:

```txt id="ys3emm"
Only return 30 diagnostic questions.
Do not expose the full bank.
Do not allow client-supplied email to unlock paid access.
Do not reuse the old client-email access fallback.
Do not expose correct answers until diagnostic is completed.
Do not expose hidden explanations for all questions before submission.
```

---

# 19. Acceptance criteria

The feature is complete when:

```txt id="e1tkhr"
User can start diagnostic without logging in.
User can choose exam type.
User gets 30 mixed questions.
User does not see instant feedback during diagnostic.
User gets basic score after completion.
User enters email to unlock full report.
Full report shows score, readiness label, weak topics, and recommended plan.
Report has CTA to buy full access.
Diagnostic lead is stored.
Diagnostic result is stored.
Homepage links to diagnostic.
Pricing page links to diagnostic.
No paid access rules are weakened.
No full paid question bank is exposed.
Mobile experience works well.
```

---

# 20. Final instruction

Build the diagnostic as a conversion funnel, not just a quiz.

The goal is to make the user think:

```txt id="ma3jlh"
“I finally know what I need to study.”
```

Then Echelon should guide them to:

```txt id="wryu5s"
Practice questions
Mock exams
AI explanations
Readiness tracking
Paid access
```
