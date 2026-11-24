# Worker brief: Echelon exam-bank gap-to-1000 build (staged content only)

You are authoring ONE batch of new exam questions for ONE course. Your task
message names the course, the batch number, and the assignment file. Read
these three files before writing anything:

1. This brief.
2. The course SPEC: ~/workspace/echelon/exam-bank-expansion/<courseKey>/SPEC.md
   The SPEC is binding for: schema variant and exact field set, example
   items (copy their shape exactly), module list, source citation list,
   and grounding. IGNORE the SPEC's numbering section and its batch topic
   plan; this build uses the assignment file for both (see below).
3. Your assignment file:
   ~/workspace/echelon/exam-bank-gap-1000/<courseKey>/assignments/batch-<N>.json
   It gives, for every item in your batch: seq, questionNum, itemId, kind
   (conceptual or calc), difficulty, cognitiveLevel, and topic. Follow it
   exactly. Item order in your output = seq order.

## Output files (write BOTH, to the gap staging folder)

1. ~/workspace/echelon/exam-bank-gap-1000/<courseKey>/batch-<N>.json
   A JSON array of exactly <size> item objects, in seq order.
2. ~/workspace/echelon/exam-bank-gap-1000/<courseKey>/batch-<N>.verify.json
   A JSON array with one record per calculation item in your batch:
   {"itemId": "<the item's itemId, or its questionNum as a string for the cand variant>", "expression": "<arithmetic only: numbers, + - * / and parentheses>", "expected": "<exact result as a decimal string, rounded to decimalPlaces>", "decimalPlaces": <int>, "unit": "<unit string>"}
   The expression must evaluate in exact rational arithmetic to the
   expected value (after rounding to decimalPlaces). Use 3.1416 for pi
   where a formula needs it, written as 3.1416 in the expression.

## bankKey

Use the assignment file's "bankKey" value in EVERY item, exactly as given.
(For the four wpi-classN-water-coll courses this is the canonical registry
bank key wpi-classN-wastewater-coll. That is deliberate; do not "fix" it.)

## Item rules (all batches)

- Composition, difficulty, cognitiveLevel, topics, questionNum and itemId
  come from the assignment file. Conceptual items come first (in seq
  order), calculation items last, exactly as the assignment lists them.
- Every item: exactly 4 options. The options array order defines optionA
  to optionD (where the variant carries them). correctIndex is the index
  of the correct option; correctAnswer is that option's exact text. Vary
  correctIndex across the batch; do not put the correct answer in the
  same position more than 40 percent of the time.
- Options must be plausible but unambiguously wrong except the key.
  Numeric options for calc items: the correct value plus three values
  from common mistakes (wrong conversion, swapped values, arithmetic
  slip), each formatted exactly like the correct one (same unit, same
  decimal places).
- The correct option must NOT be noticeably longer or more detailed than
  the distractors. Keep all four options at similar length and detail.
  Avoid absolute words (always, never, must, only, guaranteed) in the
  correct option unless the underlying fact truly is absolute; never use
  absolutes as a shortcut pattern.
- Explanation: 1 to 3 sentences justifying the key. For calc items, show
  the formula and the substitution, ending with the result and unit.
- NO EM DASHES in question text, options, answers, explanations, topics,
  or formulas (the character —). Use commas, periods, or a plain hyphen.
  EXCEPTION: sourceTitle values are copied VERBATIM from the SPEC source
  list, even where the bank's own title contains an em dash; that is
  existing bank metadata, not authored text. Also avoid the en dash
  character in authored text; write ranges with "to". Do not use the
  multiplication sign in verify expressions (use * only); in item text
  you may use the style of the SPEC example items.
- Canadian units and context only (L, m3, kg, mg/L, kPa, metres of head,
  L/s, m3/day). Follow the SPEC grounding for regulation framing: Ontario
  courses cite Ontario regulations; WPI (western) courses must NOT cite
  Ontario regulations and must NOT invent provincial regulation numbers.
- Every question is original fictional study content. Do not copy real
  exam questions, and do not claim official exam-board wording, leaked
  questions, guaranteed results, or regulatory endorsement. Facts and
  methods follow the sources in the SPEC. Never invent a regulation
  limit, a code value, or a standard number; where a calculation needs a
  factor, give the factor in the question stem ("use 9.81 kPa per metre
  of head", "at 7.14 mg as CaCO3 per mg ammonia nitrogen") exactly as the
  SPEC grounding allows.
- Calculation design: choose inputs so the exact result has at most 4
  decimal places before the stated rounding; state the rounding in the
  stem ("Round to 1 decimal place") and match decimalPlaces. Results
  must be exact decimals, no repeating decimals.
- Stems must be unique within your batch and must not restate the same
  scenario twice with different numbers. This build adds to a bank that
  already holds about 1,000 questions, including a 200-item 2026
  expansion on these same topic areas: vary scenarios, system sizes,
  settings, seasons, and phrasing so your items are clearly distinct
  from typical existing items on the topic. Do not reuse a scenario
  skeleton with swapped numbers.
- Module: follow the SPEC rule. Where the assignment topic carries a
  [Module] prefix, the module field is the bracket text and the topic
  field is the rest. Otherwise choose the module from the SPEC's allowed
  list that best fits the item (single-module courses have a fixed
  module).
- Source fields: rotate through the SPEC source list; match the cited
  source to the item's subject (safety items cite the safety source,
  regulation items cite the regulation, calculation items may cite the
  formula source where the SPEC lists one).

## Before you finish

- Re-read your batch file: item count equals the assignment size, JSON
  parses, every calc item has a verify record, and each verify
  expression really equals its expected value (compute it yourself once
  more).
- Report: the two file paths, item count, calc count, and any topic from
  the assignment you could not cover and why.
