# Worker brief: Echelon exam-bank expansion (200 new questions per course)

You are authoring ONE batch of 50 new exam questions for ONE course. Your
task message names the course and batch. Read that course's SPEC.md first
(in ~/workspace/echelon/exam-bank-expansion/<courseKey>/SPEC.md). The SPEC
is binding: schema variant, example items, numbering, module list, source
citations, batch topic plan, and grounding all live there.

## Output files (write BOTH)

1. ~/workspace/echelon/exam-bank-expansion/<courseKey>/batch-<N>.json
   A JSON array of exactly 50 item objects, in questionNum order.
2. ~/workspace/echelon/exam-bank-expansion/<courseKey>/batch-<N>.verify.json
   A JSON array with one record per calculation item in your batch:
   {"itemId": "<the item's itemId, or its questionNum as a string for the cand variant>", "expression": "<arithmetic only: numbers, + - * / and parentheses>", "expected": "<exact result as a decimal string, rounded to decimalPlaces>", "decimalPlaces": <int>, "unit": "<unit string>"}
   The expression must evaluate in exact rational arithmetic to the
   expected value (after rounding to decimalPlaces). Use 3.1416 for pi
   where a formula needs it, written as 3.1416 in the expression.

## Item rules (all batches)

- 50 items: items 1 to 40 conceptual (isCalc "no"), items 41 to 50
  calculation (isCalc "yes"), following the SPEC batch plan topics.
- Difficulty: conceptual items 1 to 10 easy, 11 to 30 medium, 31 to 40
  hard. Calculation items: 41 to 45 medium, 46 to 50 hard.
- cognitiveLevel: "recall" for easy items, "application" for medium and
  hard items.
- Every item: exactly 4 options. options array order defines optionA to
  optionD (where the variant carries them). correctIndex is the index of
  the correct option; correctAnswer is that option's exact text. Vary
  correctIndex across the batch; do not put the correct answer in the
  same position more than 40 percent of the time.
- Options must be plausible but unambiguously wrong except the key.
  Numeric options for calc items: the correct value plus three values
  from common mistakes (wrong conversion, swapped values, arithmetic
  slip), each formatted exactly like the correct one (same unit, same
  decimal places).
- Explanation: 1 to 3 sentences justifying the key. For calc items, show
  the formula and the substitution, ending with the result and unit.
- NO EM DASHES in question text, options, answers, explanations, topics,
  or formulas (the character —). Use commas, periods, or a plain hyphen.
  EXCEPTION: sourceTitle values are copied VERBATIM from the SPEC source
  list, even where the bank's own title contains an em dash; that is
  existing bank metadata, not authored text. Also avoid the en dash
  character in authored text; write ranges with "to". Do not use the multiplication sign in expressions (the verify
  file uses * only); in item text you may use the style of the example
  items.
- Canadian units and context only (L, m3, kg, mg/L, kPa, metres of head,
  L/s, m3/day). Follow the SPEC grounding for regulation framing: Ontario
  courses cite Ontario regulations; WPI (western) courses must NOT cite
  Ontario regulations and must NOT invent provincial regulation numbers.
- Every question is original fictional study content. Do not copy real
  exam questions. Facts and methods follow the sources in the SPEC.
  Never invent a regulation limit, a code value, or a standard number;
  where a calculation needs a factor, give the factor in the question
  stem ("use 9.81 kPa per metre of head", "at 7.14 mg as CaCO3 per mg
  ammonia nitrogen") exactly as the grounding allows.
- Calculation design: choose inputs so the exact result has at most 4
  decimal places before the stated rounding; state the rounding in the
  stem ("Round to 1 decimal place") and match decimalPlaces. Results
  must be exact decimals, no repeating decimals.
- Stems must be unique within your batch and must not restate the same
  scenario twice with different numbers. Vary scenarios, system sizes,
  and phrasing across items on the same topic.
- questionNum and itemId: exactly as the SPEC numbering table gives for
  your batch, sequential with item order (item 1 of the batch takes the
  first number, and so on).
- bankKey: exactly as the SPEC states, in every item.
- Source fields: rotate through the SPEC source list; match the cited
  source to the item's subject (safety items cite the safety source,
  regulation items cite the regulation, calculation items may cite the
  formula source where the SPEC lists one).

## Before you finish

- Re-read your batch file: count is 50, JSON parses, every calc item has
  a verify record, and each verify expression really equals its expected
  value (compute it yourself once more).
- Report: the two file paths, item count, calc count, and any topic from
  the plan you could not cover and why.
