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
