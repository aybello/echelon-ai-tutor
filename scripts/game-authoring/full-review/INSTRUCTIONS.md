# Full content review: instructions for each reviewer

You are verifying exam-prep game content for water and wastewater operator certification (Ontario OIT and Classes 1 to 4, western Canada WPI/ABC Classes 1 to 4, and a few US courses). The owner has decided that review by Claude models is the verification authority. Be a strict subject-matter expert. Use your knowledge, and use WebSearch/WebFetch to check anything you are not sure of (AWWA, WEF, Sacramento State OWP manuals, EPA, Health Canada, MECP Ontario, owwco.ca ABC Need-to-Know guides). Do not guess: if you cannot confirm a claim and it looks doubtful, mark it UNCLEAR with the reason.

Do NOT edit any repository file. Only write your output file.

## Input

One JSONL file. Each line is a unit: `{uid, sec, row, files, course}`.

`sec` tells you the shape of `row`:

- `facts`: `[level, statement, isTrue, explanation]`. Rapid-swipe true/false. Check the statement is unambiguously true or false as keyed, and the explanation is right.
- `boards`: `{d, prompt, pairs:[[left,right]x6]}`. Speed match. Every pair must be a correct match, and no right side may fit a different left side equally well (that makes the board ambiguous).
- `oddSets`: `{d, rule, members[], intruders[], why}`. Every member must clearly satisfy the rule; every intruder must clearly not. The game shows 3 members plus 1 intruder, so ANY member must work with ANY intruder. `why` is a template where `{odd}` is replaced by the intruder.
- `sequences`: `{d, process, steps[], why}`. Steps must be in a required, defensible order. Every pair of steps becomes a "which comes earlier/later" question, so if any two steps could reasonably be swapped, flag it.
- `relations`: `[level, scenario, affected quantity, direction, explanation]`. Direction is increase/decrease/unchanged. Check the effect is correct and is the dominant, textbook answer.
- `flaws`: `{d, prompt, flawed, goods[], explanation}`. Tap the flaw. `flawed` must be clearly false; every `goods` entry must be clearly true.
- `item`: a built game item (base bank). Modes: rapid-swipe (`correctAnswer` boolean), speed-match (`pairs`), odd-one-out / tap-the-flaw / cause-effect (`options`, `correctOptionId`), before-after (`options`, `correctAnswer`). Same standards as above.

`course` and `files` show where it is used. Course keys: `oit*` and `classN-*` are Ontario; `wpi-*` are western Canada; `us-*` are US courses. `ww`/`wastewater` = wastewater treatment, `water-dist` = distribution, `wastewater-coll`/`water-coll` = collection.

## What counts as a problem

- `WRONG`: factually wrong, or the keyed answer is wrong, or a "good" statement is false, or a pair mismatched.
- `UNCLEAR`: two answers defensible, order swappable, depends on a local rule, misleading wording, or a claim you could not verify and doubt.
- `UNITS`: US customary units (gallons, MGD, lb, psi, feet, °F, grains per gallon) in a Canadian course (anything not starting with `us-`). US units in `us-*` courses are fine.
- `JURISDICTION`: Ontario-specific rules (O. Reg., MECP, OIT, Ontario class names) in a `wpi-*` or `us-*` course; or a statement presented as universal that is only true in one jurisdiction.
- `OFF-TOPIC`: not operator knowledge.

Do not flag style or easiness. Do not flag correct items. Typical real error rate is around 1 to 2 percent, so most units are OK; but read every one.

## Output

Write `/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/review/out/<same chunk name>.jsonl` (create the folder if needed). One line per problem unit only:

```
{"uid":"U01234","verdict":"WRONG","note":"one or two sentences: what is wrong and the correct fact, with source if you checked one","fix":<replacement>}
```

`fix` is a full replacement `row` in exactly the same shape as the input `row` (same `sec`), corrected so it is true and unambiguous, keeping the same level and keeping it in plain, short operator language. Keep metric units for Canadian courses. For `oddSets`, you may just remove a bad member or intruder (keep at least 3 members and 1 intruder). For `sequences`, you may drop or reword the swappable step. Avoid the words always, never, must, only, all, every, none, cannot, completely, entirely, solely, guarantee, automatically in flawed options and fact statements. If a unit cannot be repaired sensibly, set `"fix": null` and it will be removed.

The last line of the file must be:

```
{"done":true,"reviewed":<number of units read>,"problems":<number of problem lines>,"searches":<number of web checks made>}
```

Then reply with only that summary plus the uids of any WRONG units.
