# DeepCoursePackage format, extracted from the live repo

Source of truth, read 2026-11-21 from aybello/echelon-ai-tutor via the GitHub
connector (read-only): shared/deepGames.ts, shared/deepGameNumeric.ts,
shared/scoreDeepGame.ts, server/deepGames/registry.ts, and the two pilot
packages server/deepGames/content/oit.ts and server/deepGames/content/
class1-water.ts. Local copies of the fetched sources are in
~/workspace/echelon/repo-src/.

## 1. Package shape (deepCoursePackageSchema, all objects .strict())

```
{
  courseKey,            // see section 5, currently an enum of two values
  version,              // string matching ^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$
  tasks: [DeepTask],    // 1..200 per package
  missions: [EscapeMission],  // 0..20 per package
  sources: [ { id, title, locator, note? } ],   // 1..100, ids unique
  publication: {
    published: true,
    reviewedBy,         // text, max 200
    reviewedAt,         // ISO datetime with offset
    packageSha256,      // 64 hex chars, SHA-256 of canonical payload
    taskReceipts: [ { taskId, revision, sha256, sourceIds: [1..12] } ],
                        // exactly one per task, same id and revision
    missionReceipts: [ { missionId, revision, sha256 } ],
                        // exactly one per mission
  }
}
```

Receipt hashes are SHA-256 of canonicalDeepPayload (sorted object keys,
original array order, no undefined fields) of each task or mission, and of
{courseKey, version, tasks, missions} for the package. The server validates
the whole package, hashes included, before serving. Packages built by this
project ship WITHOUT a publication block filled with real receipts: receipts
and review are a server-side publication step in the repo, and the pilot
header itself states the content is "Owner-authorized AI review, not human or
exam-board endorsement." Our files carry the tasks, missions, and sources;
publication receipts are generated at import time by the repo pipeline.

## 2. Shared task base (every task)

```
id          safe id: ^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,79}$
revision    version string, pilots use "r1"
mode        one of the four task modes below
prompt      text, 1..2000 chars, non-blank
topicId     safe id
level       "oit" or "class1" (see section 5)
assumptions text, 1..2000 chars (the schema reuses the prompt text type)
```

Options everywhere: arrays of { id, label } with 2..8 entries, unique ids,
and labels that are distinct after NFKC normalize, trim, whitespace collapse,
and lowercase. Choice steps are { id, prompt, options, correctOptionId,
explanation } with correctOptionId required to be one of the option ids.

## 3. The four task modes

### calculation-ladder (deepLadderTaskSchema)
- choices: exactly a 3-tuple of choice steps with ids in this order:
  "formula", then "units", then "substitution".
- result: a numeric step with id exactly "result":
  - unitOptions: 1..8 entries { id, label, toExpected? } where toExpected is
    a positive rational { numerator, denominator } (integer strings) giving
    the factor that converts a value in this unit to the expected unit.
    A unit option with no toExpected is a distractor, except the expected
    unit itself.
  - expected: decimal string (see numeric rules), expectedUnitId must be
    one of the unitOptions and its toExpected, if present, must be identity
    (numerator equal to denominator).
  - absoluteTolerance: non-negative decimal string. relativeTolerance:
    optional non-negative decimal string. Scoring accepts an answer when
    abs(converted - expected) is at most max(absoluteTolerance,
    abs(expected) * relativeTolerance), computed in exact rational
    arithmetic (shared/deepGameNumeric.ts compareNumericAnswer).
  - explanation: text.

### build-process (deepProcessTaskSchema)
- configuration: text (setup description).
- cards: 2..8 options { id, label }.
- correctOrder: array of card ids, must be an exact permutation of the
  card ids (same length, unique, every card present).
- explanation: text.

### find-calculation-error (deepErrorTaskSchema)
- lines: 2..8 options { id, label }, the worked calculation lines in order.
- firstWrongLineId: must be one of the line ids.
- correctedLine: text, max 300 chars (the corrected version of that line).
- explanation: text.

### evidence-detective (deepEvidenceTaskSchema)
- evidence: 1..8 options { id, label } (observations in a fictional case).
- inference: a choice step with id exactly "inference".
- nextClue: a choice step with id exactly "next-clue".
- clueText: a record mapping EVERY nextClue option id to an explanation
  text, exactly one clue per option, no extras.

## 4. Missions (exam-escape-room, deepEscapeMissionSchema)

```
{ id, revision, mode: "exam-escape-room", title (text, max 300),
  tasks: [ { taskId, revision, occurrenceId } ] }   // 2..4 entries
```
Every referenced taskId and revision must exist in the same package, and
occurrenceIds must be unique within the mission. Task ids and mission ids
must be distinct from each other across the package.

## 5. Hard limits and blockers in the current contract (READ BEFORE IMPORT)

These are properties of the repo as of 2026-11-21, not of this build:

1. Course keys: deepPilotCourseKeySchema is z.enum(["oit", "class1-water"])
   and server/deepGames/registry.ts hard-allowlists those two keys (and
   requires the registry course to be active with provinceOrRegion ontario
   or western and examFamily ontario or western). No other course can be
   served until the enum and the registry allowlist are extended.
2. Levels: task level is z.enum(["oit", "class1"]), and the package schema
   forces level "oit" for courseKey "oit" and "class1" for "class1-water".
   Class 2, 3, 4 and WPI courses have no representable level value yet.
3. Package caps: deepGameLimits are tasks 200, missions 20 per package,
   packageBytes 1,048,576. Ay's target of 100 tasks per game per course
   (400 tasks plus 100 missions) therefore needs, per course, at least two
   task packages and five mission packages, or a limits change.
4. This build's files follow the pilot field structure exactly. For courses
   beyond the two pilots, courseKey uses the real registry courseKey and
   level uses the closest pilot convention ("oit" for OIT-stream courses,
   "class1" as the placeholder for classed courses), which the repo team
   must map when they extend the schema. Each course folder's BUILD-NOTES.md
   records the mapping used.

## 6. Pilot state (the baseline this build tops up)

Both pilots are version "deep-20261119-v2", revision "r1" on every item:

| Course | Ladders | Process | Error | Evidence | Missions | Sources |
|---|---|---|---|---|---|---|
| oit | 4 | 4 | 4 | 4 | 3 | 7 |
| class1-water | 4 | 4 | 4 | 4 | 3 | 8 |

Pilot id conventions: oit tasks are oit-ladder01..04, oit-process01..04,
oit-error01..04, oit-evidence01..04, missions oit-mission01..03. Class 1
Water uses the c1w- prefix the same way. New tasks continue the numbering.

Pilot sources (oit): 7 cited sources in the package sources array; tasks
reference them through publication taskReceipts sourceIds. New content for a
course reuses and extends that course's source list, including the Drive
textbook sources recorded in SOURCES.md once they become reachable.

## 7. Numeric rules (shared/deepGameNumeric.ts)

- Decimal strings: ^-?(0|[1-9][0-9]{0,17})(\.[0-9]{1,12})?$, max 32 chars.
  No whitespace, plus sign, exponent, grouping commas, leading zeros, or
  implicit decimal point.
- Unit ids: ^[a-zA-Z0-9][a-zA-Z0-9_-]{0,31}$.
- Conversion factors are exact rationals (integer numerator and denominator
  strings), never floats. All verification in this build is done in exact
  rational arithmetic to match compareNumericAnswer.

## 8. How this build authors and verifies

Workers author tasks as JSON in each course folder. Every calculation
ladder and calculation error task is accompanied by a machine-checkable
computation record in the course's verify/ folder (inputs, formula in
evaluated form, expected result). The coordinator's verify script recomputes
every expected value in exact rational arithmetic and rejects any task whose
stored expected value, corrected line, or unit conversion disagrees. Process
tasks are checked for the exact-permutation rule and for process order
against the cited source. Evidence tasks are checked for the
one-clue-per-option rule. Counts in BUILD-NOTES.md only include tasks that
pass verification.
