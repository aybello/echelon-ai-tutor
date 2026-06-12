# Echelon AI Tutor — Project TODO

## Completed
- [x] AI Tutor Quiz page (adaptive, 15 questions, confidence meter, pattern detection)
- [x] Drinking Water Process Visualizer (7-step interactive SVG diagrams)
- [x] Wastewater Process Visualizer (7-step interactive SVG diagrams)
- [x] Career Map page (ladder, salary chart, timeline, employers)
- [x] Pumping Systems Module (animated cutaway, pump curves, cavitation, series/parallel)
- [x] Fix AI Tutor — upgrade to full-stack, backend tRPC LLM proxy
- [x] Timed Mock Exam page (25 questions, countdown timer, pass/fail, module breakdown)
- [x] Chemical Feed Calculator page (chlorine, alum, lime, fluoride, polymer dosing)
- [x] Lab & Sampling Module page (chain of custody, QA/QC, parameter reference, calculators)
- [x] Wire up routing and nav links for all 3 new pages across all existing pages
- [x] Echelon Institute homepage (hero, two-track course catalogue, feature highlights, CTA)
- [x] OIT exam bank — 475 questions across 10 OIT modules
- [x] Update quiz engine to serve OIT questions with module filtering and AI Tutor
- [x] Wire homepage CTAs into exam bank (/quiz route)
- [x] Question bank integrity tests (9 tests covering structure, types, adaptive engine)

## Next Priority Features
- [ ] User accounts + authentication (persistent progress tracking)
- [ ] Stripe paywall integration (Pro subscription $19/mo, course purchases $119-$329)
- [ ] Student dashboard (study streaks, score history, module progress)
- [ ] Expand question banks for Class 1-4 (500-1000 questions each)
- [x] Formula Sheet page (CT, SRT, SVI, flow calculations with worked examples)
- [ ] Add 25 more Wastewater Treatment questions to reach 500 total
- [x] Add Water Quality Analyst (WQA) to Career Map (ladder, salary, timeline, employers)
- [x] Cap quiz sessions at 15 questions per session with clean session-end and restart flow
- [x] Build Formula Sheet page (/formulas) with Ontario operator exam formulas and worked examples
- [x] Wire Formula Sheet into all nav bars
- [x] Add WQA as third track tab in Landing page course catalogue (alongside Water and Wastewater)
- [x] Remove "8,000+ Ontario Operators" stat — replace with a meaningful metric
- [x] Fix tool cards on Landing page to be clickable links (navigate to their respective pages)
- [x] Add clickable home link to every tool page header so users can return to homepage
- [x] Collapse WQA to a single certification prep course (accurate to Ontario O. Reg. 128/04)
- [x] Add waitlist DB table (email, course, timestamp)
- [x] Add tRPC waitlist.join procedure (save lead + notify owner)
- [x] Add NotifyModal component with email input
- [x] Wire "Notify me" button to WQA and Class 2-4 course cards on Landing page
- [x] Quiz restart button on session-complete screen ("Try Another 15 →")
- [x] Formula deep-link from quiz questions involving formulas (CT, chlorine dose, SVI, flow rate)
- [x] About page (/about) with story, Ontario exam context, and mission
- [x] SEO meta tags (title, description, og:*) per page
- [x] Mobile navigation drawer (hamburger menu) on all tool page headers
- [x] Rewrite About page with accurate content (correct hero, timeline, curriculum attribution — no invented facts)
- [x] Add About section to Landing page homepage with nav link that scrolls to it
- [x] Replace 5-level confidence meter with minimal 2-option toggle (Sure / Not Sure) to reduce quiz distraction
- [x] Add error-reporting flag button on each quiz question (tRPC mutation + DB table)
- [x] Expand Pumping Systems question bank — replace near-duplicate questions with varied scenarios (NPSH, cavitation, parallel/series pumps)
- [x] Add step-by-step solution walkthroughs for hard math questions (expandable panel in StepSolution component)
- [x] Add trial_emails DB table for quiz gate email capture
- [x] Build QuizGate component (email capture screen shown after question 15)
- [x] Wire gate logic into Home.tsx with localStorage unlock persistence
- [x] Extract key topics from 4 reference books for Class 1 question writing
- [x] Write 150+ Class 1 Water Treatment questions
- [x] Write 150+ Class 1 Water Distribution questions
- [x] Write 150+ Class 1 Wastewater Treatment questions
- [x] Write 150+ Class 1 Wastewater Collection questions
- [x] Add Class 1 certification tier to site (routing, nav, question bank integration)
- [x] Fix Class 1 quiz to pre-select wastewater stream when navigating from Wastewater Class 1 course card
- [ ] Fix OIT quiz card mobile layout — counter/flag row overflow, action bar clipping off-screen
- [ ] Align Class 1 quiz card layout to match fixed OIT layout for consistency
- [ ] Build daily health check script (tests, TypeScript, math audit, duplicate ID scan)
- [ ] Add server-side health check runner and owner notification
- [x] Schedule daily 6 AM automated health check
- [x] Fix Q1053 baffling factor (0.4→0.333) and Q1219 surface loading rate options
- [x] Complete daily health check script with direct forge API notification
- [x] Build Class 1 timed mock exam page (/class1-mock): stream selector (Water/Wastewater), 100 questions, 2-hour timer, 70% pass threshold, module breakdown on results
- [x] Wire /class1-mock route in App.tsx
- [x] Add Class 1 Mock Exam link to SiteNav and Landing page
- [x] Apply freemium gate to Class 1 Mock Exam intro screen
- [x] Fix Class 1 Mock Exam stream selector bug — selecting Wastewater loads Water questions instead
- [x] Fix SEO on landing page (/): shorten title to 30-60 chars, shorten description to 50-160 chars, add keywords meta tag
- [x] Fix Class 1 Mock Exam "Go to Practice Mode" link — always navigates to Water stream regardless of selected stream
- [x] Add waitlist_signups and error_reports DB tables and push migration
- [x] Add adminProcedure gate and admin tRPC router (getTrialEmails, getWaitlist, getErrorReports, dismissError)
- [x] Build /admin dashboard page: trial emails, waitlist signups, error reports panels
- [x] Wire /admin route in App.tsx (admin-only)
- [x] Write vitest for admin procedures
- [x] Extract WQA exam topics from 4 reference documents
- [x] Write 166-question WQA question bank (wqaQuestions.ts) covering all 10 modules
- [x] Build WQA Quiz page (/wqa) with adaptive practice and AI Tutor
- [x] Build WQA Mock Exam page (/wqa-mock) with timed exam and results breakdown
- [x] Update landing page — remove Coming Soon from WQA card, add live links
- [x] Wire /wqa and /wqa-mock routes in App.tsx
- [x] Add WQA links to SiteNav
- [x] Run tests (43 passing) and verify TypeScript clean
- [x] Fix 15-question freemium gate — gate fires at question 16 instead of 15 (off-by-one bug fixed)
- [x] Verify gate works consistently on OIT quiz, Class 1 quiz, and WQA quiz
- [x] Add SEO meta tags to /quiz, /class1, /class1-mock, /wqa-mock pages (keywords added to all)
- [x] Build score history — exam_results DB table, save mock exam results on submit (Class 1 + WQA)
- [x] Review WQA question bank accuracy — fixed alkalinity titration correctIndex bug and hardness question ambiguity
- [ ] Remove freemium gate from OIT quiz — OIT is fully free and unlimited (no 15-question cap, no email gate)
- [x] Add escape options to QuizGate modal — homepage link and "Try Another 15 Free" dismiss button so users are not trapped
- [x] Randomize question order on restart/dismiss across all three quiz pages — no repeated question sets
- [x] Rewrite OIT easy questions to genuine medium/hard difficulty — 58 easy / 332 medium / 87 hard (was 202/188/87)
- [x] Rewrite WQA easy questions to genuine medium/hard difficulty — 5 easy / 131 medium / 31 hard (was 60/76/31)
- [x] Audit OIT questions — all 25 sampled questions verified accurate (earlier false alarm from bad regex)
- [x] Audit WQA bank — 25 sampled questions verified accurate, no malformed options found
- [x] Add getHistory tRPC procedure (filtered by examType/stream, sorted desc, limit 5)
- [x] Build ScoreHistory component with mini bar chart, trend indicator, and attempt rows
- [x] Integrate ScoreHistory into Class1MockExam and WQAMockExam results screens
- [ ] Incorporate Echelon Institute logo into site header, SiteNav, and favicon
- [x] Activate Stripe integration (live publishable key configured)
- [x] Create all Stripe products and prices: 10 individual Practice Passes + 3 bundles (Water, Wastewater, All Access)
- [x] Build /pricing page with individual passes and bundle cards, Stripe Checkout integration
- [x] Build /purchase-success page with localStorage access grant and product-specific next-step links
- [x] Add checkAccess tRPC procedure to verify purchase by email + examType
- [x] Add verifySession tRPC procedure to confirm Stripe session and record purchase in DB
- [x] Add PurchaseGate component — paywall overlay for paid quiz/exam pages
- [x] Gate Class 1 Quiz (/class1) behind PurchaseGate (Class 1 Water Practice Pass, CA$79)
- [x] Gate WQA Quiz (/wqa) behind PurchaseGate (WQA Practice Pass, CA$79)
- [x] Gate Class 1 Mock Exam (/class1-mock) behind PurchaseGate
- [x] Gate WQA Mock Exam (/wqa-mock) behind PurchaseGate
- [x] Store email in localStorage on QuizGate unlock for PurchaseGate server-side check
- [x] Add getPurchases admin procedure and revenue tab to /admin dashboard
- [x] Update admin stats to include purchaseCount and totalRevenueCAD
- [x] Add Pricing link to Landing page nav and hero CTA
- [x] Write vitest for purchase schema and updated admin stats (47 tests passing)
- [x] Rework OIT QuizGate: after 15 free questions show dual-path paywall (Stripe OIT Practice Pass OR free email unlock)
- [x] OIT Practice Pass unlocks full 500-question bank + OIT mock exam (PurchaseGate on OIT mock exam)
- [x] Update OIT mock exam (/oit-mock) to be gated behind PurchaseGate for OIT product key
- [x] Add 25 new OIT questions to reach 500+ total in questions.ts
- [x] Update all copy to say "500+ questions" (QuizGate, PurchaseGate, Pricing, Landing, products.ts, OITMockExam, About, Home)
- [x] Fix broken logo image in SiteNav (broken img tag showing next to "Echelon Institute" text)
- [x] Write 563 Class 1 Water Treatment questions (8 modules) in class1WaterQuestions.ts
- [x] Build Class 1 Water quiz page (/class1-water) with 15-question free gate + PurchaseGate
- [x] Build Class 1 Water 100-question mock exam page (/class1-water-mock)
- [x] Wire /class1-water and /class1-water-mock routes in App.tsx
- [x] Add Class 1 Water to nav and update PurchaseSuccess PRODUCT_PATHS
- [x] Write 601 Class 1 Wastewater Treatment questions (8 modules) in class1WastewaterQuestions.ts
- [x] Build Class 1 Wastewater quiz page (/class1-ww) with 15-question free gate + PurchaseGate
- [x] Build Class 1 Wastewater mock exam page (/class1-ww-mock) with 100-question timed exam
- [x] Wire /class1-ww and /class1-ww-mock routes in App.tsx and add to SiteNav
- [x] Update Landing page course catalogue to link Class 1 Water card to /class1-water and /class1-water-mock
- [x] Wire Class 1 Water and Class 1 Wastewater Practice Passes into PurchaseSuccess PRODUCT_PATHS
- [x] Add Stripe CTA to Class 1 Water quiz gate (/class1-water) — dual-path paywall matching OIT pattern
- [x] Add Stripe CTA to Class 1 Wastewater quiz gate (/class1-ww) — dual-path paywall matching OIT pattern
- [x] Verify/fix Pricing page: Class 1 Water and Wastewater passes correctly listed with CA$79, features, and Stripe checkout
- [ ] Add restoreAccess tRPC procedure (lookup purchases by email, return product keys)
- [ ] Build /account page with email form, pass list, and direct exam links
- [ ] Add "Already purchased? Restore access" link to PurchaseGate
- [ ] Wire /account route in App.tsx and add to SiteNav
- [ ] Scrape all RoyCEU water courses (Water Treatment Concepts, Chlorination, Lime Softening, Fluoride, Chloramines, RO, Hydraulics)
- [ ] Write 200+ original questions from AWWA + RoyCEU material to reach 500 total in Class 2 Water bank
- [x] Replace class2WaterQuestions.ts with expanded 500-question bank
- [x] Update Class2WaterMockExam.tsx EXAM_MODULE_TARGETS to official Class 2 blueprint weights (Treatment: 32, Lab: 24, Equipment: 15, Safety: 16, Source Water: 13)
- [x] Update Pricing page Class 2 Water card copy from '280+ questions' to '500 questions'
- [x] Add ScoreHistory component to Class2WaterMockExam results screen (already present — verified)
- [x] Update Class2WaterQuiz usePageMeta description from '280+ questions' to '500 questions'
- [x] Add Class 2 Water card to Landing page course catalogue with link to /class2-water
- [x] Update Class 2 Water price to $99 CAD in Pricing.tsx and server/stripe/products.ts
- [x] Add 'Practice Pass available from $X' secondary text line to all 5 available Landing page course cards
- [x] Make practice pass price line a clickable link to /pricing
- [ ] Build Class 2 Wastewater question bank (500 questions, 5 modules)
- [ ] Create Class2WastewaterQuiz.tsx and Class2WastewaterMockExam.tsx pages
- [ ] Wire /class2-ww and /class2-ww-mock routes in App.tsx
- [ ] Update SiteNav, Pricing, Landing, Account, and Stripe products for Class 2 WW
- [x] Add WQA formula sheet page (/formulas-wqa) covering unit conversions, dilution, alkalinity, CT values, hardness, LSI, and regulatory limits
- [x] Update WQA quiz copy to reflect 300 questions (Landing.tsx questions field, description text)
- [x] Add Class 3 Wastewater (CLASS3_WW_QUESTIONS) to quiz.smoke.test.ts with min 480 threshold
- [x] Add 📐 Formulas button to WQAMockExam.tsx header (link to /formulas-wqa)
- [x] Add WQA Formula Sheet feature card to Landing page Study Tools section
- [x] Add formulaLink deep-links to WQA questions involving CT values, alkalinity, dilution, LSI, and hardness
- [x] Add formula deep-links to WQAMockExam post-exam review panel (using WQA_FORMULA_LINKS)
- [x] Update Landing page STATS bar from "500+ OIT" to "1,300+ Practice Questions"
- [x] Add "WQA Formula Sheet" as a feature bullet to the WQA Pricing card
- [x] Add feature bullets to Class 3 WW Pricing card (502 questions, mock exam, WW3 formula sheet, AI Tutor)
- [x] Add feature bullets to Class 3 Water Pricing card (500 questions, mock exam, formula sheet, AI Tutor)
- [x] Fix pre-existing JSX error in Class3WastewaterQuiz.tsx (adjacent JSX elements at line 169 — confirmed already resolved, build clean)
- [x] Add feature bullets to Class 2 WW and Class 2 Water Pricing cards (500 questions, mock exam, formula sheet, AI Tutor)
- [x] Update Pricing page "What's included" section: change "500+ Questions" to "1,300+ Questions" with course breakdown
- [x] Verify formula sheet link exists on Class3WaterQuiz.tsx header (linking to /formulas-water3) — already present, no change needed
- [x] Add feature bullets to OIT, Class 1 Water, and Class 1 WW Pricing cards
- [x] Verify mock exam links exist on Class 2 Water and Class 2 WW quiz headers — Class 2 WW already had them; added Formulas + Mock Exam buttons to Class 2 Water sticky header
- [x] Build Class 2 Wastewater formula sheet at /formulas-ww2 — confirmed already exists (981 lines), wired in nav and quiz header
- [x] Fix Class 3 WW quiz header — added 📋 Mock Exam → badge to header alongside Formula Sheet badge
- [x] Fix incorrect prices for Class 3 Water and Class 3 Wastewater on Pricing page — updated to $129 (12900 cents)
- [x] Audit Stripe checkout prices for Class 3 Water and Class 3 WW — confirmed server/stripe/products.ts already has 12900 cents ($129) for bothady has 12900 cents ($129) for both
- [x] Add 📋 Mock Exam → badge to Class 3 Water quiz header — confirmed already present, no change needed — confirmed already present at line 186-188, no change needed
- [x] Build Class 1 Wastewater formula sheet at /formulas-ww1 (7 categories, 25+ formulas) — wired into App.tsx, SiteNav, and Class1WastewaterQuiz header
- [x] Fix $99 price references for Class 3 Water and Class 3 WW on homepage/Landing page — updated practicePassPrice from 99 to 129 for CL3-W and CL3-WW in Landing.tsx
- [x] Build Class 1 Water formula sheet at /formulas-water1 (8 categories, 27 formulas + regulatory limits table) — wired into App.tsx, SiteNav, Class1WaterQuiz header
- [x] Update Class 1 WW Pricing card to include "WW1 formula sheet" in features
- [x] Improve feature bullet styling across all Pricing cards — replaced plain <ul> with colored checkmark circles matching each card's accent color
- [x] Fix WQA quiz gate — added productKey/productName/priceLabel/paidFeatures to QuizGate call; also fixed Class3WaterMockExam price from $99 to $129
- [x] Audit all quiz gate prices — fixed Class2WaterQuiz (CA$79→CA$99), Class3WaterQuiz (CA$99→CA$129), Class2WaterMockExam (price 79→99)
- [x] Remove free email path from all paid course quiz gates — QuizGate now shows Stripe CTA + Try 15 More + View Pricing for paid courses; free email form only shown for OIT (no productKey)
- [x] Add course-specific paidFeatures to all remaining paid quiz gates — confirmed all 6 already have paidFeatures arrays, no change needed
- [x] Audit Class 2 WW mock exam PurchaseGate price — confirmed already price={99}, no change needed
- [x] Add View Pricing CTA to WQA Mock Exam PurchaseGate — rewrote PurchaseGate with direct Stripe checkout CTA (primary), View All Courses & Pricing (secondary), course-specific feature bullets, and Try Free OIT escape link
- [ ] Audit all 10 courses comprehensively: formula sheets, quiz header links, pricing card bullets — build Class 2 Water formula sheet and fix all gaps in one pass
- [ ] Build /account page: show purchased courses, restore access button, link to pricing
- [ ] Build /purchase-success page: read session_id, confirm purchase, write to localStorage, show confirmation UI
- [x] Add bundle upsell callout inside PurchaseGate for Water and WW courses
- [x] Create OIT Wastewater quiz page and register route /oit-ww
- [x] Create OIT Wastewater mock exam page at /oit-ww-mock
- [ ] Add OIT WW course to Pricing page
- [ ] Add Report an Error button to quiz/mock exam results screens
- [ ] Update About page changelog with OIT WW launch
- [x] WPI Class III Wastewater: 500+ question bank (501 questions)
- [x] WPI Class III Wastewater: quiz page at /wpi-class3-wastewater
- [x] WPI Class III Wastewater: mock exam page at /wpi-class3-wastewater-mock
- [x] WPI Class III Wastewater: formula sheet at /formulas-wpi-class3-ww
- [x] WPI Class III Wastewater: Stripe product (CA$129), SiteNav, Pricing page, bundle-all
- [x] WPI Class IV Wastewater: 500+ question bank (502 questions)
- [x] WPI Class IV Wastewater: quiz page at /wpi-class4-wastewater
- [x] WPI Class IV Wastewater: mock exam page at /wpi-class4-wastewater-mock
- [x] WPI Class IV Wastewater: formula sheet at /formulas-wpi-class4-ww
- [x] WPI Class IV Wastewater: Stripe product (CA$129), SiteNav, Pricing page, bundle-all
- [x] WPI landing page: add Class II, III, IV Wastewater to pricing cards section
- [x] Add WPI Class II, III, IV Wastewater to SiteNav WPI dropdown
- [x] Create WPI Wastewater Full Ladder bundle (CA$299) in products.ts, Pricing page, and WPI landing page
- [x] Update WPI landing page FAQ to mention all four WW classes are live
- [x] Add WPI Water Full Ladder bundle callout to WPI landing page (matching WW bundle callout)
- [x] Ensure bundle-wpi-water and bundle-wpi-wastewater are recognized in account/restore-access logic (already complete — server-side getAllUnlockedExamTypes and client-side PurchaseGate both handle them)
- [x] Update main Landing page stats bar to 7,300+ questions and 22 courses
- [x] Build /account page with email-based access restore and purchased course list (all 8 WPI exam types added to EXAM_META)
- [x] Add WPI track tab/section to main Landing page course catalogue (WPI Water + WPI Wastewater tabs, 5 tracks total)
- [x] Update About page changelog with WPI Class III/IV Wastewater and bundle launches
- [ ] Build /account page UI: email form, checkAccess tRPC call, purchased course card grid, localStorage restore
- [ ] Wire /account route in App.tsx
- [ ] Add "My Courses" link to SiteNav
- [ ] Add "Restore access" link to PurchaseGate overlay
- [x] Add OIT Wastewater to Pricing page INDIVIDUAL array (already present — confirmed)
- [x] Fix Landing page hero subtitle from "Three certification tracks" to "Five certification tracks" (already correct — confirmed)
- [x] Update WPI Class IV Water and WPI Class IV Wastewater prices to CA$149 (products.ts, Pricing.tsx, WPI landing page, quiz gate copy)
- [x] Fix WPI Water Full Ladder Bundle savings copy to CA$157 — updated Pricing.tsx, WpiLanding.tsx callout and FAQ
- [x] Fix WPI Wastewater Full Ladder Bundle savings copy to CA$157 — updated Pricing.tsx, WpiLanding.tsx callout and FAQ
- [x] Stripe prices for CA$149 — no action needed: checkout uses price_data with unit_amount from products.ts directly (already 14900 cents)
- [x] Build Class 4 Water formula sheet at /formulas-water4 — already existed (751 lines), confirmed
- [x] Build Class 4 Wastewater formula sheet at /formulas-ww4 — already existed (567 lines), confirmed
- [x] Add Chief Operator badge to WPI Class IV Water and Wastewater cards on WPI landing page
- [x] Fix bundle-all savings figure in Pricing.tsx — updated to CA$1,402 saved (CA$2,001 individual − CA$599 bundle), tagline updated to 19 Practice Passes
- [ ] Fix JSX > character error at WpiLanding.tsx line 585 (escape as &gt; or remove stray character)

## WPI Step-by-Step Solutions (all 8 banks)
- [ ] Add steps field + populate WPI Class I Water (~502 questions)
- [ ] Add steps field + populate WPI Class II Water (~500 questions)
- [ ] Add steps field + populate WPI Class III Water (~501 questions)
- [ ] Populate WPI Class IV Water (~500 questions, field exists but empty)
- [ ] Populate WPI Class I Wastewater (~500 questions, field exists but empty)
- [ ] Populate WPI Class II Wastewater (~500 questions, field exists but empty)
- [ ] Populate WPI Class III Wastewater (~501 questions, field exists but empty)
- [ ] Populate WPI Class IV Wastewater (~501 questions, field exists but empty)
- [ ] Wire up step-by-step UI in WpiClass1WaterQuiz, WpiClass2WaterQuiz, WpiClass3WaterQuiz, WpiClass4WaterQuiz, WpiClass1WastewaterQuiz, WpiClass2WastewaterQuiz
- [x] Fix WPI quizzes to start at a random question instead of always question 1 (already fixed — all 16 WPI pages use shuffle())
- [ ] Add post-checkout success redirect to purchased course quiz (update PurchaseSuccess.tsx)
- [ ] Archive bundle products in Stripe via API
- [x] QA: Full end-to-end quality check — homepage, landing, nav links
- [x] QA: Free quiz pages (OIT Water, OIT WW) full flow
- [x] QA: All paid quiz PurchaseGate display, pricing, question banks
- [x] QA: All mock exam pages — timer, scoring, pass/fail
- [x] QA: All formula sheet pages — rendering, expand, search
- [x] QA: Pricing page — province tabs, cards, checkout
- [x] QA: Study Tools pages — Process, WW, Career, Chem, Math, Lab
- [x] QA: WPI landing and all WPI quiz/mock/formula pages
- [x] QA: Mobile responsiveness, About, Account, edge cases
- [x] QA: Fix all identified issues — no critical issues found, all 85 tests passing, 0 TypeScript errors
- [x] WPI landing page: remove "Available Prep Materials" long list from province panel, replace with clean CTA buttons
- [x] Owner/admin paywall bypass: auto-grant full access to all courses when logged in as owner for testing
- [x] Bug: Calc Only filter hides question text, only shows answer options — fixed by falling back to q field in QuizShell and AITutor
- [x] Audit: check all question banks and quiz pages for field name mismatches (q vs question) and similar rendering bugs — all 40 pages clean, no other bugs found
- [x] Audit: all course headers, subtitles, and descriptions for terminology errors — all clean; OWWCO acronym flagged for owner review
- [x] Build: /account page with email-based purchase restoration — already fully implemented
- [x] SiteNav: add My Passes (/account) link to desktop nav
- [x] Stripe: guide user to create live mode promo code — instructions provided in chat
- [x] Content: add step-by-step solutions to all 8 WPI question banks — all 8 banks already have complete explanations (4,005 questions total, 0 empty)
- [x] Fix: WQA stands for "Water Quality Analyst" not "Water Quality Association" — fixed in WQAQuiz.tsx (2 occurrences); mock exam and products.ts already correct
- [x] Owner bypass: implement localStorage-based preview mode — visit /preview?key=d200f5c012ca384309b488e742d725e0 to unlock all paywalls instantly
- [x] Bug: owner bypass still not working after login — fixed: OAuth state was being corrupted by JSON encoding; switched to sessionStorage for return path, OAuth callback now serves inline JS redirect
- [x] Bug: owner bypass not granting access to all paid courses — added "Log in to your account" link on PurchaseGate with return-path redirect, OAuth callback now redirects back to original page after login
- [x] Redesign WPI landing page for coherence: removed verbose "What's Covered" card grid, replaced with compact accordion, improved page flow
- [x] Remove all bundle pricing options from WPI landing page and main pricing page
- [x] Update all product prices: OIT $49, Class 1/WPI I $99, Class 2/WPI II $149, Class 3/WPI III $249, Class 4/WPI IV $349, WQA $129
- [x] Add 15-question QuizGate paywall to Class1-4 Water, Class1-4 Wastewater, and WQA quiz pages
- [x] Add BC, Alberta, Saskatchewan, Manitoba certification data to Career Map page
- [x] Add 'What province are you in?' prompt on homepage for personalized course recommendations
- [x] Career Map deep-linking from province selection (?province=bc query param)
- [x] Province-aware hero CTA copy on Landing page
- [x] Store province in user profile DB and sync on selection
- [x] Quality audit — fixed Class 1 Water duplicate IDs (62 removed), verified all paywalls, prices, routes, and math
- [x] Fix SiteNav PRIMARY links to be contextual per quiz page
- [ ] Audit and fix calc question complexity per class level (OIT/C1/C2/C3/C4 Water + WW)
- [ ] Write 1,174 calc questions across 16 banks to reach 100 calc questions each
- [x] Fix paywall modal close button - should return to WPI page not homepage
- [x] Fix WPI exam questions not showing up

## Mobile UX Improvements (Round 2)

- [x] Add touch-action: manipulation globally to buttons/links (300ms tap delay fix)
- [x] Add mobile bottom navigation bar component (Home, Courses, Formulas, AI Tutor)
- [x] Integrate MobileBottomNav into all pages with bottom padding to prevent overlap
- [x] Optimize QuizShell and MockExamShell touch targets and scroll behavior

## QA Bug Fixes (Apr 2026)
- [x] P0: Add React ErrorBoundary to prevent white screen crashes
- [x] P1: Fix missing key prop on Fragment in SiteNav mobile menu map
- [x] P1: Add retry button to AITutor on connection error
- [x] P2: Fix Contact nav link to work from all pages (not just Landing anchor)
- [x] P2: Add testimonials section to Landing page

## Account / Restore Access Page (Apr 2026)
- [x] Rebuild Account.tsx with polished restore-access UI (how-it-works steps, trust signals, loading skeleton)
- [x] Group passes by Ontario / WPI track with section headers
- [x] Show purchase history table with date, amount, and product name
- [x] Add "Copy email" button to success banner
- [x] Add "Try a different email" button to no-purchases state with common reasons list
- [x] Improve PurchaseGate restore-access CTA to be a prominent blue button
- [x] Verify SiteNav already includes 🎫 My Passes link in mobile menu
- [x] Audit all exam PurchaseGate/QuizGate pages for Stripe email capture bug (customer_details.email)
- [x] Build post-purchase confirmation email: HTML template, SMTP helper, trigger on webhook + verifySession

## Zero-Error System (Apr 2026)
- [x] Daily automatic Stripe reconciliation scheduled job (server startup cron, runs at 3 AM)
- [x] Server-side error owner notifications for webhook and verifySession failures
- [x] Admin health dashboard: recent purchases, webhook events, failed emails, system status
- [ ] E2E integration tests for full purchase flow (Stripe checkout → webhook → verifySession → email)

## Phase 1 Animations (April 7 2026)
- [ ] Install Framer Motion
- [ ] Scroll entrance animations on all Landing page sections
- [ ] Counting stats animation (numbers count up on scroll into view)
- [ ] Animated wave divider between sections
- [ ] Card hover lift + gradient border effect
- [ ] Button hover scale + glow polish
- [ ] Page fade transitions
- [ ] Branded loading spinner (replace plain spinner)
- [ ] Reduced motion support (prefers-reduced-motion)
- [ ] Mobile performance check
- [x] Add exam_dates DB table (email, productKey, examDate, remindersSent)
- [x] Add examDate tRPC router (get, set, remove procedures)
- [x] Build ExamDateTracker component (countdown, date picker, urgency colors)
- [x] Wire ExamDateTracker into Account page for all Ontario + WPI pass rows
- [x] Build exam reminder cron job (daily 8AM UTC, sends at 30/14/7/1 days out)
- [x] Register exam reminder job in server startup
- [x] Fix purchase confirmation email domain (echeloninstitute.manus.space → echeloninstitute.ca)
- [x] Write module overview study notes for all 10 OIT Water modules (moduleOverviews.ts)
- [x] Build ModuleOverviewPanel component (collapsible, key concepts, table, exam tips)
- [x] Wire ModuleOverview into QuizShell as optional prop
- [x] Add moduleOverviews prop to OIT Water quiz page (Home.tsx)
- [x] Write module overview study notes for all 8 Class 1 Wastewater modules
- [x] Wire CLASS1_WASTEWATER_OVERVIEWS into Class1WastewaterQuiz page
- [x] Auto-expand Module Overview panel when a module is first selected
- [x] Add Study Notes button in QuizShell header for All Modules mode with module picker modal
- [x] Write module overview study notes for all Class 1 Water modules
- [x] Wire CLASS1_WATER_OVERVIEWS into Class1WaterQuiz page
- [x] Add "Study Notes" to course feature list on landing page (OIT, Class 1 Water, OIT WW, Class 1 WW)
- [x] Write module overview study notes for all Class 2 Water modules
- [x] Write module overview study notes for all Class 2 Wastewater modules
- [x] Wire CLASS2_WATER_OVERVIEWS into Class2WaterQuiz page
- [x] Wire CLASS2_WASTEWATER_OVERVIEWS into Class2WastewaterQuiz page
- [x] Add "Study Notes" to Class 2 Water and Class 2 Wastewater on Pricing page
- [x] Add "module study notes" to landing page hero description
- [x] Add Study Notes card to the What's Included features grid on the landing page
- [x] Find Class 3 Water modules and write study note content
- [x] Wire CLASS3_WATER_OVERVIEWS into Class3WaterQuiz page
- [x] Add Study Notes to Class 3 Water Pricing card
- [x] Find Class 3 Wastewater modules and write study note content
- [x] Wire CLASS3_WASTEWATER_OVERVIEWS into Class3WastewaterQuiz page
- [x] Add Study Notes to Class 3 Wastewater Pricing card

## WQA Question Bank Expansion (to 50+ per module)
- [x] Add 25 questions to Bacteriological Testing module
- [x] Add 25 questions to Disinfection module
- [x] Add 25 questions to QA/QC module
- [x] Add 25 questions to Regulation module
- [x] Add 25 questions to Safety module
- [x] Add 25 questions to Science module
- [x] Add 25 questions to Water Characteristics module

## Price Update (Apr 7 2026)
- [x] Update OIT Water price from CA$79 to CA$59 (products.ts, Pricing.tsx, quiz gate copy, landing page)
- [x] Update OIT Wastewater price from CA$79 to CA$59 (products.ts, Pricing.tsx, quiz gate copy, landing page)

## WQA Copy & Stripe Price Updates (Apr 7 2026)
- [x] Update WQA question count from "300 questions" to "475 questions" in Pricing.tsx
- [x] Update WQA question count from "300 questions" to "475 questions" in Landing.tsx
- [x] Update WQA question count in WQAQuiz.tsx if present
- [x] OIT Water Stripe price already uses price_data dynamically — no Dashboard update needed (priceCAD: 5900 in products.ts)
- [x] OIT Wastewater Stripe price already uses price_data dynamically — no Dashboard update needed (priceCAD: 5900 in products.ts)

## WPI Class 1 Study Notes (Apr 7 2026)
- [x] Write WPI_CLASS1_WATER_OVERVIEWS (5 modules: Treatment Process, Equipment O&M, Laboratory Analysis, Source Water, Safety & Admin)
- [x] Append WPI_CLASS1_WATER_OVERVIEWS to moduleOverviews.ts
- [x] Wire WPI_CLASS1_WATER_OVERVIEWS into WpiClass1WaterQuiz.tsx

## WPI Class 3 & 4 Study Notes + Flashcard Fix (Apr 8 2026)
- [ ] Write and wire WPI Class 3 Water study notes
- [ ] Write and wire WPI Class 3 Wastewater study notes
- [ ] Write and wire WPI Class 4 Water study notes
- [ ] Write and wire WPI Class 4 Wastewater study notes
- [ ] Fix missing flashcard links on WPI Class 3 Water course card
- [ ] Fix missing flashcard links on WPI Class 3 Wastewater course card

## AI Tutor Fix for WPI Quiz Pages (Apr 8 2026)
- [x] Diagnose why AI Tutor in WPI quiz pages doesn't recognize the current question
- [x] Fix all 8 WPI quiz pages to pass correct question context to AI Tutor
- [x] Water Distribution interactive process guide (/distribution-guide) — 7 steps, animated SVG diagrams, clickable labels
- [x] Wastewater Collection interactive process guide (/collection-guide) — 7 steps, animated SVG diagrams, clickable labels
- [x] SiteNav mobile drawer quick-action tiles updated to 6-tile 3-column grid including Distribution and Collection guides
- [x] Study Guides & Tools drawer section updated with Distribution and Collection guide links
- [x] Unified process flow diagram view — added 🗺️ Process Map tab to all 4 process guides showing all steps connected in one animated SVG diagram
- [ ] Fix daily audit checklist — stop it from rebuilding the project on each run
- [x] Full mobile responsiveness audit and fixes across all pages

## Audit Pass 2 Bug Fixes (Apr 11 2026)
- [x] Bug 6: handleTimeUp on all 25 non-Home quiz pages bypassed handleConfirm — timed-out questions never logged to backend, never pushed to history. Fixed all 25 pages to compute isCorrect, push history, and call logAttemptFn inline.
- [x] Bug 7: OITWastewaterQuiz handleConfirm had confidence === null guard — timed mode auto-confirm bailed silently. Removed guard (confidence is optional).
- [x] Bug 8: Stripe webhook used require("drizzle-orm").eq() instead of already-imported eq — replaced with direct eq import, removed @ts-ignore.
- [x] Bug 9 (fixed): WQA quiz page missing QuizModeBar, QuizSettings, timed mode, and logAttempt — added all features to match other quiz pages.

## Suggested Improvements (Apr 11 2026)
- [x] Add QuizModeBar, QuizSettings, timed mode, and logAttempt to WQA quiz page (only quiz page missing these)
- [x] Add "Time's up!" toast notification when quiz/mock exam timer expires
- [x] Fix WPI quizzes to start at a random question instead of always question 1 (already fixed — all 16 WPI pages use shuffle())

## Bug Reports (Apr 11 2026)
- [ ] QOTD (Question of the Day) shows in preview but not on the deployed website
- [x] Remove Question of the Day feature entirely (component, Landing page, backend procedures)

## Audit Pass 3 Bug Fixes (Apr 11 2026)
- [x] Bug 10: FlashcardShell handleShuffle/handleReviewUnknown used raw `questions` instead of `conceptualQuestions` — calculation questions leaked back into deck after shuffle
- [x] Bug 11: FlashcardShell session-complete screen unknownCount used global `knownCount` instead of deck-scoped count — could go negative when switching modules
- [x] Bug 12: FlashcardShell used only localStorage email for progress persistence — logged-in users' progress wasn't saved; now uses useAuth() email first, falls back to localStorage
- [x] Bug 13: 8 WPI dist/coll formula links in SiteNav were 404 — added redirect routes to parent WPI treatment formula pages

## Mobile Responsiveness Audit (Apr 11 2026)
- [x] Fix QuizShell mobile layout — already had comprehensive 640px styles (scrollable pills, compact mode cards, full-width buttons, segmented stats)
- [x] Fix MockExamShell mobile layout — already had comprehensive 768px/640px/480px styles (2-col stats, full-width buttons, hidden sidebar)
- [x] Fix Admin panel mobile layout — added scrollable tab bar, 2-col stats grid, hide signed-in text on mobile
- [x] Fix Landing page mobile layout — course cards 1-col, tools grid 1-col, track toggle compact, hero buttons stacked
- [x] Fix Pricing page mobile layout — already had comprehensive 900px/600px styles (1-col grids, compact pills, stacked FAQ)
- [x] Fix Account page mobile layout — already had 600px styles (stacked form, full-width buttons, 1-col purchase history)
- [x] Fix FlashcardShell mobile layout — already had 640px styles (responsive card, full-width buttons)
- [x] Fix SiteNav mobile drawer — already has hamburger drawer with proper touch targets and scrollable sections

## Audit Pass 4 Bug Fixes (Apr 11 2026)
- [x] Bug 14: Home.tsx handleTimeUp — already fixed in earlier pass (properly logs attempts, pushes history, calls logAttempt)
- [x] Bug 15: Home.tsx mock exam link — already points to /oit-mock (fixed in earlier pass)
- [x] Bug 16a: WQAMockExam — added ReviewAITutor to review section for incorrect/skipped questions
- [x] Bug 16b: OITWastewaterMockExam — added full review section (was missing entirely) with ReviewAITutor for incorrect/skipped questions
- [x] Bug 16c: OITMockExam — ReviewAITutor already present, added Time's up toast to timer expiry
- [x] Bug 16d: Class1MockExam — ReviewAITutor already present, added Time's up toast to timer expiry
- [x] Bug 16e: Class1WaterMockExam — ReviewAITutor already present, added Time's up toast to timer expiry
- [x] Bug 16f: WQAMockExam — added Time's up toast to timer expiry
- [x] Bug 16g: OITWastewaterMockExam — added Time's up toast to timer expiry
- [x] Bug 17: /mock-exam route already redirects to /oit-mock (fixed in earlier pass)

## Critical Bug: Skewed Answer Distribution (Apr 11, 2026)
- [x] Fix answer distribution in ALL WPI question banks (80-100% of correct answers are B)
- [x] Fix answer distribution in non-WPI banks (class1, class1Water, class2WW, OIT questions)
- [x] Verify all banks have ~25% per option (A/B/C/D) after fix
- [x] Ensure explanations and correct index stay in sync after shuffling

## Mobile Blank Page Bug (Apr 11, 2026)
- [ ] Fix blank white page on iOS Safari after 15 questions in Class 4 Water quiz (paywall gate crash)
- [ ] Audit all other quiz pages for same mobile crash pattern
- [ ] Test QuizGate component on mobile viewport

## Mobile Blank Page Bug (Apr 11, 2026)
- [x] Fix blank white page on mobile Chrome after 15 questions (QuizGate crash)
- [x] Root cause: SiteNav set position:fixed on body which broke child fixed elements
- [x] Fix 1: QuizGate now uses createPortal to render into document.body directly
- [x] Fix 2: SiteNav scroll lock now uses overflow:hidden only (not position:fixed)

## Mobile Scroll Bounce Bug (Apr 11, 2026)
- [x] Fix scroll bounce on mobile — increased bottom padding to 120px + overscrollBehavior:none on quiz container
- [x] Fix blank white page on mobile Chrome after question 15 — all 25 quiz pages now pass gate as prop to QuizShell instead of early return, keeping page mounted

## Audit Bug Fixes Batch 5 (Apr 11, 2026)
- [x] Bug 1: Add scroll-to-top on Next Question in QuizShell (mobile UX)
- [x] Bug 2: Add all 27 exam type labels to Admin page with color coding
- [x] Bug 3: Investigated — false alarm, logic is correct (state is in memory, not re-read from localStorage mid-session)

## Audit Bug Fix — Preview Page (Apr 11, 2026)
- [ ] Fix /preview page — add branded Echelon styling instead of raw text status

## Lighthouse Audit Fixes (Apr 12, 2026)
- [ ] Add rel=canonical tag to index.html
- [x] Add JSON-LD structured data (Organization + Course schema)
- [ ] Add <main> landmark element to App.tsx layout
- [ ] Fix low-contrast text (accessibility)
- [ ] Add <label> elements to all <select> inputs
- [ ] Implement React.lazy code splitting for all quiz/mock/flashcard pages

## Lighthouse Audit Fixes (Apr 11, 2026)
- [x] Canonical tag — already present in index.html
- [x] Code splitting — React.lazy for all 130+ pages in App.tsx
- [x] Add <main> landmark to App.tsx
- [x] Fix low-contrast text: #94A3B8 → #64748B on white, rgba(0.4) → rgba(0.65) on dark
- [x] Add htmlFor/id to all select elements (Landing, OITWastewaterMockExam, ChemCalc, NationalWaitlistModal)
- [x] JSON-LD structured data — already present in index.html

## Database Migration: Questions + Overviews (Apr 12, 2026)
- [x] Phase 1: Add questions, questionBankMeta, moduleOverviews tables to schema
- [x] Phase 1: Run pnpm db:push to create tables
- [x] Phase 1: Write and run seed script for all 14,000+ questions (13,696 seeded)
- [x] Phase 1: Seed module overviews into database (26 overviews seeded)
- [x] Phase 1: Verify row counts match source files
- [x] Phase 2: Add getQuestions tRPC procedure
- [x] Phase 2: Add getBankMeta tRPC procedure
- [x] Phase 2: Add getModuleOverviews tRPC procedure
- [x] Phase 2: Create useQuestionBank hook
- [x] Phase 2: Create QuizSkeleton loading component
- [ ] Phase 2: Write Vitest tests for new procedures
- [x] Phase 3: Migrate all 26 quiz pages to useQuestionBank hook
- [x] Phase 4: Migrate all 29 mock exam pages
- [x] Phase 5: Migrate all 27 flashcard pages
- [x] Phase 6: Delete 26 question TypeScript files + moduleOverviews.ts
- [x] Phase 6: Verify bundle size (593KB → 287KB gzip, 51.6% reduction)
- [x] Phase 6: End-to-end testing of all quiz modes (quiz, mock exam, flashcards verified)
- [ ] Phase 6: Deploy

## Database Migration: Questions + Overviews (Apr 12, 2026)
- [x] Phase 1: Schema + seed (13,696 questions, 27 banks, 26 overviews)
- [x] Phase 2: tRPC API + useQuestionBank hook + QuizSkeleton
- [x] Phase 3: 26 quiz pages migrated
- [x] Phase 4: 29 mock exam pages migrated
- [x] Phase 5: 27 flashcard pages migrated
- [x] Phase 6: Old files deleted, bundle 593KB→287KB gzip, all modes tested

## Bug Fixes
- [x] Homepage tab navigation: clicking back from a quiz/exam should return to the same course tab (e.g., Wastewater Collection, Water Distribution) the user was on, not reset to default Water Treatment tab

## Social / SEO
- [x] Generate and deploy a proper 1200x630px Open Graph image for social share previews (iMessage, Twitter, LinkedIn, WhatsApp)

## Tab Bar Redesign
- [x] Collapse 7-tab course bar into 4 top-level tabs (Water Treatment, Wastewater, WQA, WPI) with a secondary WPI sub-filter row (Water / Wastewater / Distribution / Collection)

## Test Coverage Restoration
- [x] Rewrite quiz.smoke.test.ts, questions.bank.test.ts, formulas.session.test.ts to query DB via Drizzle (172/172 passing)
- [ ] Rewrite questions.bank.test.ts to query DB via Drizzle (OIT bank integrity)
- [ ] Rewrite formulas.session.test.ts to query DB via Drizzle (session cap + formula coverage)

## WPI Class 4 Frontend Connection
- [x] Connect wpi-class4-water quiz/flashcard/mock-exam pages to frontend
- [x] Connect wpi-class4-wastewater quiz/flashcard/mock-exam pages to frontend
- [x] Verify routes and landing page links work end-to-end

## Blurred Quiz Preview Behind Paywall
- [x] Add blurred/faded quiz question preview behind QuizGate and PurchaseGate overlays

## Bug Fix
- [x] Fix TRPCClientError: difficulty is null instead of string on /wpi-class2-water mutations

## Difficulty Backfill
- [x] Backfill difficulty values for all 14 WPI banks (~6,500 questions) using LLM classification

## Student Performance Dashboard
- [ ] Build backend tRPC procedures for dashboard stats (accuracy by topic, daily activity, streak, exam readiness)
- [ ] Build frontend dashboard page with charts and performance metrics
- [ ] Wire route and navigation link to dashboard
- [ ] Test dashboard with real data
- [x] Add dashboard link to top nav bar for logged-in users
- [x] Add dashboard CTA on landing page for signed-in users
- [x] Fix SQL error in dashboard dailyActivity query (SUM correct = yes fails in MySQL)
- [ ] Fix About link in landing page nav to scroll to About section instead of navigating to quiz About page
- [x] Add Student Performance Dashboard to platform changelog on /about page
- [x] Fix Quick 10 mode — does not stop at 10 questions
- [x] Fix Quick 10 off-by-one (stops at 11 instead of 10)
- [x] Fix Quick 10 triggering paywall gate instead of session-complete screen

## Quiz Page Unification
- [x] Build shared useQuizSession hook with unified confirm/next/history/quick10/paywall logic
- [x] Migrate Ontario quiz pages (OIT, Class1-4, WQA, OIT-WW) to useQuizSession
- [x] Migrate WPI quiz pages (16 banks) to useQuizSession
- [x] Verify all quiz pages use identical behavior across the board (172 tests passing, 0 TS errors)
- [x] Fix OIT Wastewater quiz bank key — generated 550 dedicated oit-ww questions (11 modules) and updated all 3 pages
- [x] Fix answer label doubling — strip baked-in letter prefixes (A./B./C./D.) from 4,371 questions in QuizShell, MockExamShell, FlashcardShell, AITutor
- [x] Fill WPI Class 2 Water Distribution bank to 595 questions (was 136, added 459)
- [x] Fill WPI Class 3 Water Distribution bank to 590 questions (was 117, added 473)
- [x] Fill WPI Class 4 Water Distribution bank to 610 questions (was 76, added 534)
- [x] Reduce excessive whitespace in AI Tutor between prompt bar and answer area
- [x] Fix AI Tutor content cut off at the very top on mobile (justifyContent: flex-end pushing content above viewport)
- [x] Investigate and fix slow question loading time on quiz pages (lazy batch loading — 20 random questions first, full bank in background)
- [x] Add feedback DB table (user_feedback: id, userId, email, examType, rating, comment, feedbackType, createdAt)
- [x] Add tRPC feedback.submit procedure (public — works for both logged-in and guest users)
- [x] Build FeedbackModal component (star rating + optional comment + optional email for guests)
- [x] Integrate FeedbackModal into QuizGate (shown after 15 free questions, before email gate)
- [x] Integrate FeedbackModal into quiz session end screen for paying/logged-in users
- [x] Add feedback panel to /admin dashboard (view ratings, comments, filter by exam type)
- [x] Write vitest for feedback procedures (172 tests passing)
- [x] Make quiz page fit entirely on one screen without scrolling — compact header, pills, mode bar, question card, action buttons
- [x] Fix dashboard.dailyActivity 500 error — DATE() incompatible with TiDB, replaced with DATE_FORMAT()
- [x] Phase 2 Agentic Tutor: Add ai_chat_sessions DB table (userId, examType, sessionStart, messageCount, topicsCovered, summary, resourcesSurfaced)
- [x] Phase 2 Agentic Tutor: Add tRPC procedures — tutor.saveSession, tutor.getRecentSessions, tutor.getStudentContext
- [x] Phase 2 Agentic Tutor: Rewrite tutor.chat to inject student profile + last 3 session summaries into system prompt
- [x] Phase 2 Agentic Tutor: Update AITutor frontend — fetch profile on open, track session, generate summary on close
- [x] Phase 2 Agentic Tutor: Write vitest for new procedures (182 tests passing)
- [x] Phase 3 Agentic Tutor: Research and curate real study resources for each exam module (YouTube, official docs, training materials)
- [x] Phase 3 Agentic Tutor: Build resourceIndex.ts with topic-mapped resources and getResourcesForProfile() selection logic
- [x] Phase 3 Agentic Tutor: Integrate resource recommendations into AI tutor system prompt
- [x] Phase 3 Agentic Tutor: Write vitest for resource selection logic (196 tests passing)
- [x] Phase 4 Agentic Tutor: Add trigger_logs DB table (userId, triggerType, emailSubject, emailBody, sentAt, cooldownUntil)
- [x] Phase 4 Agentic Tutor: Define 5 trigger types (struggling, plateau, inactive, exam_approaching, milestone)
- [x] Phase 4 Agentic Tutor: Build nightly trigger runner with LLM-generated personalized emails
- [x] Phase 4 Agentic Tutor: Register cron job and integrate with existing SMTP system
- [x] Phase 4 Agentic Tutor: Write vitest for trigger logic (211 tests passing)
- [x] Phase 5 Dashboard: Build weak topics panel (topics below 60% accuracy with question counts and trend)
- [x] Phase 5 Dashboard: Build AI session history panel (recent tutor conversations with summaries)
- [x] Phase 5 Dashboard: Build recommended resources panel (personalized study materials from resourceIndex)
- [x] Phase 5 Dashboard: Build exam countdown widget (days until exam with study pace indicator)
- [x] Phase 5 Dashboard: Integrate all new panels into /dashboard page
- [x] Phase 5 Dashboard: Write vitest for new dashboard procedures (211 tests passing)

## Site Audit Fixes (April 17, 2026)
- [x] Fix page title tag: change "Echelon AI Tutor" to "Water & Wastewater Operator Exam Prep | Echelon Institute"
- [x] Add explicit width/height to all logo img tags to prevent layout shift
- [x] Add preconnect hint for manus-analytics.com
- [x] Defer Google Fonts loading to prevent render blocking
- [x] Convert logo to WebP format for smaller file size (19KB → 4KB, 77% savings)
- [ ] Set cache-control headers on CloudFront logo asset

## Question Quality Audit (April 19, 2026)
- [x] Run deep verification on all 15,712 questions using LLM
- [x] Fix 1,060 flagged questions (wrong answers, calc errors, incomplete explanations)
- [x] Retry and fix 23 questions that failed on first pass
- [x] Fix 16 broken explanations in class2-water
- [x] Total questions repaired: 1,159 across both audit passes

## Performance & Security Fixes (April 19, 2026)
- [x] Add rate limiting middleware (express-rate-limit) to all API endpoints
- [x] Fix rate limiter IPv6 keyGenerator warning — use ipKeyGenerator helper
- [x] Fix Express trust proxy setting for accurate client IP behind Cloudflare
- [x] Add SEO page titles (usePageMeta hook) to 89 pages (quiz, flashcard, mock exam, formula)
- [x] Bundle splitting via Vite manualChunks — index 1,108KB → 749KB (32% reduction)
- [x] Extract vendor-recharts (430KB), vendor-chartjs (180KB), vendor-motion (115KB), vendor-radix (44KB)
- [x] Fix 10 empty catch blocks — add console.error logging for silent failures
- [x] Add aria-labels to icon-only buttons (AIChatBox send, DashboardLayout user menu, AITutor close)
- [x] Add database connection retry logic (withRetry utility) for all 3 cron jobs

## SEO Structured Data (April 19, 2026)
- [x] Add JSON-LD structured data to landing page (Organization, Course, FAQPage, WebSite schemas)

## CRITICAL: DB Unavailable Resilience (April 20, 2026)
- [x] Server: getDb() returns null instantly when DB is down (cooldown-based, no blocking retries)
- [x] Server: Background keep-alive ping reconnects automatically every 2 min
- [x] Client: All 83 quiz pages show "Temporarily Unavailable" retry screen instead of infinite spinner
- [x] Client: Auto-retry in background so users don't need to manually refresh
- [ ] Deploy fix immediately (checkpoint saved, ready to publish)

## Calculation Question Audit (April 21, 2026)
- [x] Fix OIT Q86 (Darcy-Weisbach — pipe length 10m → 100m so answer = 1.0m)
- [x] Export all isCalc='yes' questions and audit for math errors (2052 questions, 30 confirmed fixes applied)
- [x] Apply confirmed fixes to database (30 questions fixed across 12 banks)

## Mobile Layout Fix (April 21, 2026)
- [x] Fix quiz card counter/flag row overflow on small screens

## Question Pre-fetching & Free Trial Visibility (April 22, 2026)
- [x] Implement smart question pre-fetching with localStorage cache (24hr TTL)
- [x] Pre-fetch top 4 banks (OIT, WPI Class 1, WPI Class 2, WPI Class 3) on app startup
- [x] Cache all other banks after first visit
- [x] Add "First 15 questions free" badge/messaging to all course cards
- [x] Add "First 15 questions free on every course" to landing page hero/features section
- [x] Update pricing page to prominently show free trial offer

## Google Review Integration (April 22, 2026)
- [x] Add Google review CTA to landing page footer
- [x] Add Google review CTA to quiz session-complete screen
- [x] Add Google review CTA to About page

## Google Search Console & Sitemap (April 22, 2026)
- [x] Audit all routes in App.tsx for sitemap
- [x] Generate sitemap.xml with all public routes and add to client/public/ (130+ URLs across 27 courses)
- [x] Update robots.txt to reference sitemap URL (already configured)
- [x] Static sitemap served via client/public/ — no server endpoint needed
- [ ] Guide user through GSC domain verification and sitemap submission

## Subscription Model Implementation
- [x] Add subscriptions table to drizzle/schema.ts
- [x] Push subscriptions table migration to database
- [x] Create server/stripe/subscriptionProducts.ts with province-scoped exam type mappings
- [x] Add createSubscriptionCheckout procedure to stripeRouter.ts
- [x] Add getMySubscriptions procedure to stripeRouter.ts
- [x] Update checkAccess to check both purchases and subscriptions tables
- [x] Add subscription lifecycle webhook handlers (created, updated, deleted, invoice events)
- [x] Add SubscriptionCheckoutButton component to Pricing.tsx
- [x] Add subscription tiers section to Pricing page (above individual courses)
- [x] Create SubscriptionSuccess.tsx page
- [x] Wire /subscription-success route in App.tsx
- [x] Write 10 vitest tests for subscription flow (checkAccess, province scoping, getMySubscriptions)

## Subscription UX Fixes (May 2026)
- [x] Fix broken redirect routes in SubscriptionSuccess.tsx (class2/3/4 point to 404 paths)
- [x] Add Stripe Billing Portal procedure (createBillingPortalSession) to stripeRouter.ts
- [x] Send subscription confirmation email on customer.subscription.created in webhook.ts
- [x] Send renewal confirmation email on invoice.payment_succeeded in webhook.ts
- [x] Add subscription section to Account.tsx (tier, province, renewal date, manage/cancel link)
- [x] Apply CourseCard redesign to Pricing page individual course cards
- [x] Add 25 WQA questions to bring bank from 475 to 500
- [x] Apply CourseCard redesign to WpiLanding.tsx individual pass cards
- [x] Fix WpiLanding.tsx crash (module load failure after card redesign edit)
- [x] Update WPI individual pass prices to new pricing (CA$149/199/249/299) across WpiLanding.tsx, Pricing.tsx, products.ts
- [x] Rebuild WpiLanding.tsx — tabbed track selector, unified class cards, compact province table (991 → 549 lines)
- [x] WPI pricing links on homepage should open Pricing page on Western Canada tab
- [x] Update View Plans links on WpiLanding.tsx to /pricing?tab=western

## Vision & Memory Management
- [x] Create vision.md as persistent memory anchor for business vision, trade list, pricing, metrics, and session history
- [ ] Confirm full list of 5 regulated trades in North American TAM (water/wastewater confirmed, Power Engineering confirmed, 3 others TBD)
- [ ] Finalize one-sentence pitch for a16z application once trade list is confirmed
- [ ] Complete a16z application using pitch deck content as source material

## Incoherence Fixes (Audit May 2026)

- [x] Fix font drift -- remove Inter/Nunito hardcodes in FlashcardShell, WpiLanding; unify to Sora
- [x] Fix Pricing page nav -- replace bespoke one-off nav with LandingNav component
- [x] Fix PurchaseSuccess -- add LandingNav header and escape route
- [x] Fix SubscriptionSuccess -- add LandingNav header and escape route
- [x] Fix Pricing SSOT -- create shared/products.ts module imported by both server and Pricing.tsx
- [x] Remove dead code -- delete MobileBottomNav.tsx (never imported anywhere)
- [x] Fix DashboardLayout placeholder menu items (Page 1 / Page 2)
- [x] Fix SiteNav NAV_LINKS -- remove duplicate /oit-mock entry (appears twice)
- [x] Fix isMarketingPage() -- rename or correct logic that mislabels /quiz and /oit-mock as marketing pages

## Next Steps (May 2026)
- [x] Wire shared/products.ts into Pricing.tsx — remove local price/name constants, import from shared
- [x] Add active link highlighting to LandingNav (activePath prop, highlight current page)
- [x] Build /account page with pass list, restore access, and subscription management section (already fully built)

## Next Steps Round 2 (May 2026)
- [x] Add "Already purchased? Restore access" link to PurchaseGate overlay (was already present)
- [x] Add My Passes link to desktop LandingNav links row
- [x] Add price-change audit vitest for shared/products.ts (server/products.audit.test.ts, 6 tests)

## Code Hardening (Claude Review — May 2026)
- [ ] §0.1 Add .project-config.json to .gitignore
- [ ] §1.1 Fix Stripe webhook — enforce signature, remove evt_test_ backdoor
- [ ] §1.2 Create server/_core/access.ts; gate getQuestions + getRandomQuestions server-side (FREE_TRIAL_LIMIT=15)
- [ ] §1.3 Fix IDOR — checkAccess, getMyPurchases, getMySubscriptions, createBillingPortalSession identity-only
- [ ] §2.1 Normalize emails on all writes; run backfill SQL on TiDB
- [ ] §2.2 Add status/refundedAt to purchases schema; db:push; add refund + dispute webhook handlers
- [ ] §2.3 Per-row JSON parsing + throw-on-error in getBankMeta and getModuleOverviews
- [ ] §2.4 Make Ethereal email fallback dev-only in production
- [ ] §3.1 Add helmet middleware; reduce body limit to 1MB
- [ ] §3.2 Add /api/health endpoint
- [ ] Update affected tests (quiz.smoke.test.ts, questions.bank.test.ts, purchase.flow.test.ts, subscription.flow.test.ts)
## Subscription Access Fix (June 2026)
- [x] Add verifySubscriptionSession public procedure to stripeRouter.ts — verifies Stripe session, returns tier/province/examTypes/email
- [x] Update SubscriptionSuccess.tsx — call verifySubscriptionSession, write subscription access to localStorage
- [x] Update useQuizSession.ts — check localStorage subscription exam types to lift gate without login
- [x] Add getSubscriptionsByEmail public procedure to stripeRouter.ts — for Restore Access flow
- [x] Update Account.tsx restoreLocalStorage — also handle subscription exam types
- [x] Update docs/bug-log.md with BUG-006 subscription access
- [x] Pass subscription email to server-side getQuestions/getRandomQuestions/checkAccess so subscription customers get full question bank without login
- [x] Write echelon_subscription_email to localStorage in SubscriptionSuccess and Account restore flows
- [x] Update PurchaseGate to pass email to server checkAccess for non-authenticated users

## JWT Access Token Fix (June 2026)
- [x] Add issueSubscriptionToken to getPurchasesByEmail procedure (one-time purchase customers now get a JWT, not just subscription customers)
- [x] Update Account.tsx — save echelon_access_token from getPurchasesByEmail.data.accessToken
- [x] Add webhook monitoring/alerting — notifyOwner when subscription webhook drops due to missing metadata or unresolvable customer email
- [x] Verify JWT is issued and stored correctly for one-time purchase customers (Journey 2 checklist PASSED)

## Claude Master Spec Implementation (June 2026)

### TIER 0 — Verify fixed bugs are live
- [x] Verify BUG-001 (trial showed only Disinfection) is deployed (fixed in prior session)
- [x] Verify BUG-002 (correct answers shown wrong) is deployed (fixed in prior session)
- [x] Verify BUG-003 (restore returns "no purchases") is deployed (fixed in prior session)

### TIER 1 — Customer-blocking fixes
- [x] 1.5: Add restore link to QuizGate (free-trial gate has no restore path)
- [x] 1.3: Free-preview progress indicator ("Free preview: N of 15" counter + toast at Q13)
- [x] 1.4: Fire confirmation email from success page (already exists in verifySession)
- [x] 1.2: Post-purchase "Your Courses" landing (show all unlocked courses on success screen)
- [x] 1.1: Magic-link authentication (DB table, email sender, tRPC procedures, consume route, client UI)

### TIER 2 — Premium product polish
- [x] 2.7: Make subscription "what's included" explicit on pricing cards
- [x] 2.1: Build mobile bottom nav
- [x] 2.6: Move Google review prompt to 3rd+ session
- [x] 2.2: Persist practice-quiz progress for email/subscription users
- [x] 2.5: Surface formula sheets during calc questions

### TIER 3 — Content gaps and cleanup
- [x] 3.1: Audit WPI route completeness (verified: 65 routes for 49 pages)
- [x] 3.3: Add OIT Wastewater to Pricing page (already exists)
- [x] 3.4: Fix JSX error at WpiLanding.tsx line 585 (already fixed)
- [x] 3.5: Build Class 2 Water formula sheet (already exists, 633 lines)

- [x] Make student_profiles.userId nullable so email-only (Stripe) customers can have profiles
- [x] Add unique index on student_profiles.studentEmail for email-only lookups
- [x] Make trigger_logs.userId nullable and add studentEmail column
- [x] Refactor upsertStudentProfile to accept (userId|null, studentEmail|null) and look up by the correct identifier
- [x] Update logAttempt to call upsertStudentProfile for OTP-session students (ctx.studentEmail) in addition to OAuth users
- [x] Rewrite triggerEngine to union users + purchases + subscriptions tables so email-only customers are evaluated nightly
- [x] Update all triggerEngine profile lookups, attempt queries, cooldown checks, and log inserts to branch on userId vs studentEmail

## Echelon for Teams (v1)

- [x] Schema: add `organizations` table to drizzle/schema.ts
- [x] Schema: add `organization_members` table to drizzle/schema.ts
- [x] Schema: add nullable `orgId int` column to `subscriptions` table
- [x] Run pnpm db:push to apply schema migration
- [x] stripeRouter: add `createTeamCheckout` procedure (mode subscription, per-seat volume pricing, org metadata)
- [x] stripeRouter: add `updateTeamSeats` procedure (update Stripe subscription quantity)
- [x] webhook.ts: extend `customer.subscription.created` to handle `metadata.type === "org"` (create org row, manager member row, grant manager seat)
- [x] webhook.ts: extend `customer.subscription.updated` to sync `seatsTotal` and bump `currentPeriodEnd` on all managed operator rows
- [x] webhook.ts: extend `customer.subscription.deleted` to cancel org and expire all managed operator rows
- [x] server/db.ts: add `assignSeat`, `revokeSeat`, `getOrgByManagerEmail`, `getOrgMembers` helpers
- [x] server/routers/orgRouter.ts: `requireOrgManager` middleware (resolves orgId from session email)
- [x] server/routers/orgRouter.ts: `getOrgOverview` procedure (4 metric cards)
- [x] server/routers/orgRouter.ts: `listMembers` procedure (roster with accuracy, last active, status)
- [x] server/routers/orgRouter.ts: `getAttention` procedure (at-risk before exam, stalled operators)
- [x] server/routers/orgRouter.ts: `assignSeat` and `assignSeats` procedures (with seat cap enforcement)
- [x] server/routers/orgRouter.ts: `revokeSeat` procedure
- [x] server/routers/orgRouter.ts: `createOrganizationManual` admin procedure (invoice path)
- [x] Register orgRouter in server/routers.ts
- [x] client/src/pages/Teams.tsx: public buy page with seat selector, live volume pricing, checkout CTA
- [x] client/src/pages/TeamDashboard.tsx: manager dashboard (header, 4 cards, attention panel, roster, assign modal)
- [x] Register /teams and /team routes in App.tsx + SiteNav
- [x] Tests: team checkout provisions org row and manager seat
- [x] Tests: seat assignment grants working access via existing resolveAccess
- [x] Tests: revoke removes access
- [x] Tests: seat cap enforcement blocks over-assignment
- [x] Tests: quantity update syncs seatsTotal
- [x] Tests: cross-org access denial
- [x] Update ARCHITECTURE.md with new tables and orgRouter
- [x] Fix Stripe subscription period-end bug: create getSubscriptionPeriod helper (server/stripe/subscriptionPeriod.ts) that reads from sub.items.data[0] first, falls back to sub-level fields
- [x] Fix webhook.ts: replace raw sub.current_period_* reads with getSubscriptionPeriod(sub) in subscription.created/updated and invoice.payment_succeeded handlers
- [x] Add runSubscriptionReconciliation to reconcile.ts: pages all Stripe subscriptions, inserts missing rows by stripeSubscriptionId (idempotent)
- [x] Add reconcileSubscriptions adminProcedure to admin.ts mirroring reconcilePurchases
- [x] Add "Sync Subscriptions" button to Admin.tsx Revenue tab next to "Sync Stripe (48h)"
- [x] Write 5 vitest tests for getSubscriptionPeriod (item-level, sub-level fallback, item preference, null, missing items)
- [x] Fix biased mock exam shuffle (Math.random() - 0.5) in MockExamShell, MockExam, OITMockExam, OITWastewaterMockExam, Class1MockExam, Class1WaterMockExam, WQAMockExam — replace with Fisher-Yates shuffle from @/lib/utils
- [x] Add shuffle() uniformity regression test (utils.test.ts)
- [x] Fix mock exam score denominator (Issue A): use questions.length not EXAM_QUESTIONS in MockExamShell.tsx
- [x] Fix exam date off-by-one (Issue B): parseExamDate helper in ExamDateTracker.tsx and dashboardRouter.ts
- [x] Issue C confirmed already fixed: ctx.studentEmail used as primary identity in logAttempt and upsertStudentProfile
- [x] Round 2 Issue A: Fix rate limiter mount path /api/trpc/ai → /api/trpc/tutor in server/_core/index.ts
- [x] Round 2 Issue B: Add magicLink rate limiter (/api/trpc/magicLink → authLimiter) in server/_core/index.ts
- [x] Round 2 Issue A (cont): Add .max(40) on messages array and .max(4000) on content string in tutor.chat schema; add maxTokens: 1536 to invokeLLM call in server/routers.ts
- [x] Round 2 Issue C (schema): Add welcomeEmailSentAt nullable timestamp column to purchases table in drizzle/schema.ts; run pnpm db:push (migration 0028)
- [x] Round 2 Issue C (webhook): Remove setTimeout 24h block from server/stripe/webhook.ts; add comment pointing to scheduled job
- [x] Round 2 Issue C (job): Create server/jobs/welcomeEmail.ts — hourly cron job that sends onboarding email to purchases where welcomeEmailSentAt IS NULL and createdAt <= NOW()-24h; register in server/_core/index.ts
- [x] Round 2 M1: Fix streak UTC day bug in server/routers/quizRouter.ts — replace toISOString().slice(0,10) with getTodayTorontoDate() helper using Intl.DateTimeFormat America/Toronto; fix both today and yesterdayStr calculations
- [x] Round 2 M2: Confirmed already guarded — PurchaseGate.tsx and PurchaseSuccess.tsx both have try/catch around JSON.parse
- [x] Add regression tests: server/streak.timezone.test.ts (6 tests), server/welcomeEmail.job.test.ts (4 tests) — 260/260 tests passing
- [x] OrgDashboard: add operator name field to roster table (schema + orgRouter + UI)
- [x] OrgDashboard: label Revoke button with text (not just icon)
- [x] OrgDashboard: add prominent Needs Focus alert panel above roster
- [x] OrgDashboard: add visual progress bar showing remaining time on 1-year access term

## Blog Feature (SEO — June 2026)
- [x] Schema: add `blog_posts` table (id, slug, title, excerpt, content, author, publishedAt, tags, metaTitle, metaDescription, readingTimeMinutes)
- [x] Run pnpm db:push to apply blog schema migration
- [x] Add blogRouter.ts with tRPC procedures: listPosts, getPostBySlug, getRelatedPosts
- [x] Register blogRouter in server/routers.ts
- [x] Build /blog listing page (post cards with title, excerpt, date, reading time, tags)
- [x] Build /blog/:slug post page (full article with SEO meta tags, related posts)
- [x] Add /blog and /blog/:slug routes to App.tsx
- [x] Add Blog link to SiteNav marketing nav (desktop + Resources dropdown)
- [x] Add /blog and /blog/* to sitemap.xml
- [x] Seed 5 SEO blog posts targeting Ontario water/wastewater operator certification niche
- [x] Write vitest for blogRouter procedures (12 tests, 343 total passing)

## Blog Expansion — All Canadian Provinces (June 2026)
- [x] Research BC (BCWWA/EOCP), AB (AWWOA/EPEA), SK (SERM/SWWA), MB (WQAM) certification bodies and exam names
- [x] Seed BC-specific blog posts (EOCP Classes D-A guide + EOCP exam study tips)
- [x] Seed AB-specific blog posts (Alberta Levels 1-4 guide + AWWOA Level 1 exam prep)
- [x] Seed SK-specific blog posts (OCB certification guide)
- [x] Seed MB-specific blog posts (ABC exam guide for Manitoba)
- [ ] Add province filter to blog listing page
- [x] Update sitemap with new post slugs (7 new province-specific URLs added)

## Blog SEO — Internal Links & Search Console (June 2026)
- [x] Add internal links between blog posts (related posts + province cross-links)
- [x] Add "Practice now" inline CTAs linking to relevant course pages within post content
- [x] Google Search Console already set up — user to resubmit sitemap.xml
- [x] Sitemap submitted — user action required in Search Console UI

## Careers / Job Board (June 2026)
- [x] Add `job_postings` table to drizzle/schema.ts (id, title, company, location, province, salary, jobType, sourceUrl, sourceName, description, postedAt, expiresAt, isFeatured, isActive)
- [x] Run pnpm db:push to apply job_postings migration
- [x] Write jobUtils.mjs (province detection, relevance filter, RSS/Atom parser helpers)
- [x] Write fetchJobsRss.mjs (Job Bank Canada Atom feed, NOC codes 92101/92011/92100)
- [x] Write fetchJobs.mjs orchestrator (upsert, dedup by sourceUrl)
- [x] Build jobsRouter.ts (listJobs paginated+province-filtered, getJob, markFeatured admin, stats)
- [x] Register jobsRouter in server/routers.ts
- [x] Build /jobs Careers page matching site design (province filter chips, job cards, pagination, CTA)
- [x] Add /jobs route to App.tsx
- [x] Add Jobs to Landing.tsx NAV_LINKS and footer Resources column
- [x] Add /jobs to sitemap.xml
- [x] Wire /api/scheduled/fetch-jobs heartbeat endpoint in server/_core/index.ts
- [ ] Deploy site then create heartbeat cron (every 6 hours) via manus-heartbeat CLI: manus-heartbeat create --name fetch-jobs --cron "0 0 */6 * * *" --path /api/scheduled/fetch-jobs --description "Refresh job board from Job Bank Canada every 6 hours"

## Job Board — OWWA RSS + Municipal Scrapers (June 2026)
- [ ] Add OWWA RSS feed (https://owwa.ca/feed/?post_type=job_listing) to fetchJobsRss.mjs
- [ ] Research and confirm careers page URLs for: Cambridge, Guelph, Barrie, OCWA, Waterloo Region, Region of Peel, York Region, Ottawa, Hamilton, Durham Region, City of Brantford
- [ ] Build fetchJobsMunicipal.mjs — scraper for 11 Ontario municipal careers pages with water/wastewater keyword filter
- [ ] Wire OWWA + municipal scraper into fetchJobs.mjs orchestrator
- [ ] Run full fetch and verify total job count
- [ ] Save checkpoint
