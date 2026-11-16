# Basic Math CE draft: review result

Draft: `content/ceu-drafts/ceu-basic-math.json` (one fix round, 2026-11-16, working tree only, not committed). Ids, correctIndex values and the 4-choice structure are unchanged. Answer positions are still balanced: checks 6/6/6/6, final 5/5/5/5, alternate final 5/5/5/5. The JSON parses and keeps its original formatting (2-space indent, no trailing newline).

## Models and planted-error detection

Both models reviewed review copies, not the real draft. Each copy had one wrong correctIndex per unit, one altered explanation number per unit, and one altered lesson number per module (16 plants in total, listed in `plants.json`).

| Unit | Plants | GPT-6.1 Sol | Gemini 4 hydrogen |
| --- | --- | --- | --- |
| number-skills | c3 key; c5 explanation (1.51 to 4.27); lesson 3.6 to 10.2 | all 3 | all 3 |
| units-conversions | c6 key; c1 explanation (60 to 92); lesson 5,004 to 13,004 lb | all 3 | all 3 |
| areas-volumes | c5 key; c3 explanation (7.48 to 13.22); lesson 44 to 91 | all 3 | all 3 |
| plant-formulas | c5 key; c6 explanation (10,000 to 17,000); lesson 150 to 303 | all 3 | all 3 |
| final | f2 key; f1 explanation (7.48 to 13.22) | both | both |
| final-alt | a4 key; a1 explanation (7.48 to 13.22) | both | both |

- All 12 output files were complete: none started with ERROR and none was under 200 bytes, so nothing was rerun.
- Both models caught 16 of 16 plants and restored the right value each time.
- Real issues each model raised on its own (outside the plants):
  - Both: a1's "1,224 MGD" explanation; the clarifier example's rounded-area step (1,519.8 x 11 is not 16,717.4).
  - GPT only: number-skills-a5 "four places"; plant-formulas-c5 "inverted the ratio"; the "mg per million mg" units story; the example 4 "divided by a million gallons leaves MGD" wording; the detention-time quick reference; percent and ppm basis; C1V1 density; the "always the same" volume method.
  - Gemini only: the a2 "936 gpm" explanation (as a NIT); the "2.785, about 2.78" rounding; missing "x 100" in two lesson lines.
- As with Hydraulics, GPT raised more theory-level points. Gemini was terser.

## Real findings fixed (in the real draft)

Lessons:
- number-skills: "Most missed exam questions ... are missed because" and "The most common error" were frequency claims with no evidence. Softened to "Many" and "A very common". The scientific-notation range now reads "from 1 up to (but not including) 10".
- number-skills figure: the "1 / 1.0 / 100%" column sat at x = 355 while the bar ends at x = 360, so 1 was not at 100 percent. Moved the labels and ticks to 360. The other columns already sat exactly at 1/8, 1/4, 1/2 and 3/4 of the bar.
- units-conversions: added "US gallons" (the audience includes Canada).
- units-conversions, example 1: 1.8 x 1.547 = 2.7846, so the step now shows 2.7846 rather than 2.785 rounded down to 2.78. The cross-check now uses the unrounded 1,249.9 gpm and says the two paths "agree within the rounding of the constants".
- units-conversions: "1 mg/L equals 1 ppm" is now "taken as 1 ppm (by weight) for water and dilute solutions". "1 percent = 10,000 mg/L" is now operator convention for solutions that weigh about the same as water, with "use the supplier's data" for strong, heavy chemicals.
- units-conversions, example 4, step 4: "gallons per day divided by a million gallons leaves MGD" was a wrong unit statement (gal/day divided by gal is 1/day). Rewritten as dividing by 1,000,000 gal per million gallons.
- areas-volumes: "The method is always the same" and the depth-from-volume formula are now limited to tanks with straight vertical walls (they do not hold for cones).
- areas-volumes, example 2: step 1 now shows 1,519.76 sq ft (about 1,519.8), and step 2 says to carry the unrounded area. Before, 1,519.8 x 11 did not give the printed 16,717.4.
- plant-formulas: the pounds-formula explanation "the million in MGD cancels the million in mg/L (mg per million mg)" was dimensionally wrong. It now says: 1 mg/L is about 1 ppm by weight, MGD x 8.34 is millions of pounds of water per day, and each ppm of that is 1 lb/day. Example 1 step 3 matches (1.6 x 8.34 = 13.3 million lb/day; 2.0 ppm of it).
- plant-formulas: added the "x 100" step to the percent-removal example (0.92 x 100) and to the strength example (12 / 150 x 100).
- plant-formulas: C1 x V1 = C2 x V2 now carries one sentence: it is an exam shortcut that treats both solutions as weighing about the same as water; for strong or heavy chemicals such as 12 percent hypochlorite, check the supplier's dilution data.
- plant-formulas quick reference: "Detention time: volume / flow x 24 h" is now "Detention time (h): volume gal / flow gal/day x 24".

Questions:
- units-conversions-c2: the choice "0.00003 mg/L" was a rounded 0.25 / 10,000 = 0.000025. Choice and explanation now say 0.000025.
- plant-formulas-c5: the explanation said "11.5 percent" "inverted the ratio". The real inverse is 150 / 12 = 12.5. 11.5 is 138 / 12 (water over chemical), and the explanation now says so.
- plant-formulas-c6: choice C ("A misplaced decimal point, so the answer is ten times too large") was the longest option and restated the answer. Now "Moving the decimal point one place to the right", parallel with the other three. Key unchanged.
- units-conversions-a1: the "1,224 MGD" distractor comes from dividing by 1,000, not from leaving out the million. The "0.59 MGD" distractor (850 / 1,440) also skips the million-gallon step. Both explanations corrected.
- units-conversions-a2: the "936 gpm" explanation now says what was done (0.65 x 1,440).
- number-skills-a5: going from 0.4 to 0.0004 moves the point three places, not four. Fixed.

Every number was recomputed with a python3 -I script: all lesson examples, the four facilitator guides, and all 64 questions including each distractor's arithmetic. No other arithmetic errors were found, and no key was wrong in the real draft. The planted errors exist only in the review copies.

## Figures (5 inline SVGs)

All agree with the lesson:
- Fraction strip: fixed as noted above.
- MGD-to-gpm cancellation: 2.5 x 1,000,000 / 1,440 = 1,736.1.
- Shape formulas: match the text and the quick reference.
- Depth figure: 22,440 / 7.48 = 3,000 cu ft; / 600 sq ft = 5.0 ft. It is not drawn to scale, and it does not claim to be.
- Pounds triangle: 8.34 is labelled "lb per gal of water", which matches the revised text.

## Rejected and why

- GPT: label units-conversions-f3 and every percent item "% w/v". This is handled once in the lesson instead. Operator exams use plain "percent", and the items state the 10,000 mg/L constant.
- GPT: replace C1V1 with mass-balance (w1 m1 = w2 m2) using densities, and write 8.34 as lb/(MG x mg/L). Both are correct but too heavy for an entry-level course. A one-line caveat and a corrected plain-English units story were added instead.
- GPT: rewrite plant-formulas-c5 choice C as "1,250 percent". Fixing the explanation was enough; 11.5 is a realistic slip.
- GPT: areas-volumes-c3 and a1 explanations should say "pounds mislabelled as gallons". The current wording ("used the weight constant 62.4 in place of 7.48") already names the slip.
- Gemini NIT: the detention-time and SOR quick-reference units. Fixed for detention time only; the SOR row already states gal/day.

## Leftover nits (not fixed this round)

- units-conversions-c1: the explanation "divided gallons per day by 60 only, treating a day as an hour" is correct but awkward.
- plant-formulas-f3: the "20.1 h" distractor (flow over volume) does not come out in hours. It works as a distractor but is not a realistic slip.
- number-skills facilitator guide: the average flow (1.90 MGD) equals Friday's reading. Fine for a worksheet, but a learner might think they copied a value.
- Many explanations are "mislabelled unit" stories ("reported cubic feet as gallons"). They are consistent, but a little repetitive.
- Activities and minutes were not checked against `plannedMinutes` (210).

## Caveats

- Not compared against any official exam, certifying-agency need-to-know list, formula sheet or current Sacramento State manual edition.
- Sources: the Wisconsin DNR and California SWRCB entries are specific PDFs with section pointers, but no constant or claim was checked page by page against them. The Sacramento State and EPA NPDES entries are landing pages. No constant is cited to a page.
- Constants are the conventional rounded operator values (7.48, 8.34, 62.4, 694.4, 1.547, 0.785, 10,000 mg/L per percent). Answers are rounded to match.
- Reviewer models saw lessons with the SVGs stripped, so the figure check is mine alone.
- Duration (210 min) has not been validated, and no contact hours are awarded.
