# Migration Plan: Question Banks from JS Bundle to Database

**Project:** Echelon Institute — Canadian Water/Wastewater Operator Exam Prep  
**Date:** April 12, 2026  
**Author:** Manus AI

---

## 1. Problem Statement

The Echelon Institute web application currently bundles all 14,000+ exam questions as TypeScript arrays inside the client-side JavaScript. This architecture produces a **2,158 KB main bundle** (593 KB gzipped) that must be downloaded and parsed before the landing page becomes interactive. The Lighthouse Performance score is **26/100**, with a First Contentful Paint of 7.4 seconds and a Time to Interactive of 17.9 seconds on a simulated mid-range mobile device.

The question data files alone total **12 MB of TypeScript source** across 26 files. Even with code splitting via `React.lazy()`, the question arrays are eagerly imported inside each page component, so Vite still bundles them into per-page chunks that are pulled into the main entry graph. The core problem is that question content is treated as application code rather than as data that should be fetched on demand.

---

## 2. Current Architecture

### 2.1 Question Data Files

There are **26 question bank files** in `client/src/lib/`, each exporting a typed array of question objects plus module metadata. The total raw source is 158,605 lines across these files.

| File Group | Files | Approx. Questions | Correct-Answer Field |
|---|---|---|---|
| Ontario Classes 1–4 Water | 4 | ~1,950 | `correct` |
| Ontario Classes 1–4 Wastewater | 4 | ~1,950 | `correct` |
| Ontario OIT (Class 1 combined) | 1 | ~250 | `correct` |
| WPI Classes 1–4 Water | 4 | ~2,220 | `correctAnswer` |
| WPI Classes 1–4 Wastewater | 4 | ~2,400 | `correctAnswer` |
| WPI Classes 1–4 Water Distribution | 4 | ~2,000 | `correctAnswer` |
| WPI Classes 1–4 Wastewater Collection | 4 | ~2,000 | `correctAnswer` |
| WQA | 1 | ~475 | `correct` |
| **Total** | **26** | **~14,000** | — |

### 2.2 Question Shape Variants

The question objects are not fully uniform. There are two main variants:

**Ontario / WQA variant** (9 files):
```typescript
{
  id: number;
  module: string;
  difficulty: "easy" | "medium" | "hard";  // present in most, absent in class2WW
  question: string;
  options: string[];
  correct: number;         // 0-indexed
  explanation: string;
  steps?: { l: string; c: string }[];
  tip?: string;
  isCalc?: boolean;
  topic?: string;          // present in some Ontario files
}
```

**WPI variant** (17 files):
```typescript
{
  id: number;
  module: string;
  question: string;
  options: string[];
  correctAnswer: number;   // 0-indexed (different field name)
  explanation: string;
  steps?: { l: string; c: string }[];
  tip?: string;
  isCalc?: boolean;
  // difficulty NOT present in most WPI files
}
```

### 2.3 Consumer Pages

The question data is consumed by three types of pages, totalling **82 page components**:

| Page Type | Count | How Questions Are Used |
|---|---|---|
| Practice Quiz pages | 26 | Full bank loaded into `allQuestions`, random selection client-side, filtered by module/calc/difficulty |
| Mock Exam pages | 29 | Full bank loaded, `selectExamQuestions()` samples proportionally by module targets |
| Flashcard pages | 27 | Full bank passed as props, filtered to exclude `isCalc` questions |

Each quiz page also imports a **MODULES** array (list of module names) and some import **MODULE_TARGETS** (question distribution for mock exams). Two files export **FORMULA_LINKS** mappings (class4WW and WQA).

### 2.4 Sidecar Data

Beyond the question arrays, there is a separate `moduleOverviews.ts` file (648 KB, 6,646 lines) that provides study-guide-style overviews per module. This is imported by quiz pages for the module info panels. It should also be migrated to the database eventually, but it is a lower priority since it is only loaded on quiz pages, not the landing page.

### 2.5 Current tRPC Quiz Router

The existing `quizRouter` at `server/routers/quizRouter.ts` has four procedures:

| Procedure | Type | Purpose |
|---|---|---|
| `logAttempt` | mutation | Logs every quiz answer (examType, topic, questionId, correct, difficulty, quizMode) |
| `getMissedQuestions` | query | Returns question IDs the user got wrong (most-recent-attempt logic) |
| `getWrongCountForQuestion` | query | Returns how many times a user got a specific question wrong |
| `getStudentProfile` | query | Returns topic accuracy, weak/strong topics, streaks |

Critically, **none of these procedures serve question content**. They only operate on question IDs and attempt metadata. The question content is always resolved client-side from the bundled arrays.

---

## 3. Target Architecture

### 3.1 Database Schema

Add a single `questions` table to `drizzle/schema.ts`:

```typescript
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  bankKey: varchar("bankKey", { length: 64 }).notNull(),
    // e.g. "class1-water", "wpi-class2-wastewater-coll", "wqa"
    // matches the examType values already used in questionAttempts
  questionNum: int("questionNum").notNull(),
    // the original per-bank sequential ID (1, 2, 3...)
  module: varchar("module", { length: 128 }).notNull(),
  difficulty: varchar("difficulty", { length: 16 }),
    // null for WPI banks that don't have difficulty
  question: text("question").notNull(),
  optionA: text("optionA").notNull(),
  optionB: text("optionB").notNull(),
  optionC: text("optionC").notNull(),
  optionD: text("optionD").notNull(),
  correctIndex: int("correctIndex").notNull(),
    // 0=A, 1=B, 2=C, 3=D
  explanation: text("explanation").notNull(),
  steps: text("steps"),
    // JSON: [{ "l": "label", "c": "content" }] or null
  tip: text("tip"),
  isCalc: mysqlEnum("isCalc", ["yes", "no"]).default("no").notNull(),
  topic: varchar("topic", { length: 128 }),
    // optional secondary categorization
});
```

Also add a `question_bank_meta` table for module lists, module targets, and formula links:

```typescript
export const questionBankMeta = mysqlTable("question_bank_meta", {
  id: int("id").autoincrement().primaryKey(),
  bankKey: varchar("bankKey", { length: 64 }).notNull().unique(),
  modules: text("modules").notNull(),
    // JSON array of module names: ["Treatment Process", "Equipment O&M", ...]
  moduleTargets: text("moduleTargets"),
    // JSON: { "Treatment Process": 32, "Equipment O&M": 28 } or null
  formulaLinks: text("formulaLinks"),
    // JSON: { "WQA-M001": "/formulas-wqa#unit-conversions" } or null
  totalQuestions: int("totalQuestions").notNull(),
});
```

**Why flat columns instead of a JSON `options` array?** Individual columns (`optionA`–`optionD`) are simpler to query, index, and validate. All 14,000 questions have exactly 4 options, so there is no need for a variable-length array.

**Why a composite `(bankKey, questionNum)` instead of reusing the existing `id`?** The auto-increment `id` becomes the stable primary key for foreign-key references (e.g., from `questionAttempts`). The original per-bank `questionNum` is preserved for backward compatibility with existing `questionAttempts.questionId` values.

### 3.2 New tRPC Procedures

Add to `quizRouter`:

```typescript
// Fetch questions for a bank (paginated, filterable)
getQuestions: publicProcedure
  .input(z.object({
    bankKey: z.string().min(1).max(64),
    module: z.string().max(128).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    calcOnly: z.boolean().optional(),
    questionIds: z.array(z.number()).max(100).optional(),
      // for missed-question mode: fetch specific questions by questionNum
    limit: z.number().int().min(1).max(600).default(600),
    offset: z.number().int().min(0).default(0),
  }))
  .query(async ({ input }) => { /* ... */ }),

// Fetch bank metadata (modules, targets, formula links)
getBankMeta: publicProcedure
  .input(z.object({
    bankKey: z.string().min(1).max(64),
  }))
  .query(async ({ input }) => { /* ... */ }),
```

The `getQuestions` procedure returns the full question bank for a given `bankKey` in a single request (most banks are 400–600 questions, which is roughly 200–400 KB of JSON — smaller than the current JS bundle equivalent because there is no code overhead). The optional filters allow the client to request subsets (e.g., only calc questions, only a specific module, or specific question IDs for missed-question mode).

### 3.3 Client-Side Hook

Create a shared `useQuestionBank` hook:

```typescript
// client/src/hooks/useQuestionBank.ts
export function useQuestionBank(bankKey: string) {
  const { data: bankMeta, isLoading: metaLoading } = trpc.quiz.getBankMeta.useQuery(
    { bankKey },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  const { data: questionsData, isLoading: questionsLoading } = trpc.quiz.getQuestions.useQuery(
    { bankKey },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  return {
    questions: questionsData?.questions ?? [],
    modules: bankMeta?.modules ?? [],
    moduleTargets: bankMeta?.moduleTargets ?? null,
    formulaLinks: bankMeta?.formulaLinks ?? null,
    totalQuestions: bankMeta?.totalQuestions ?? 0,
    isLoading: metaLoading || questionsLoading,
  };
}
```

Setting `staleTime: Infinity` means the question bank is fetched once per session and cached in React Query's memory — no re-fetches on tab focus or navigation. This gives the same "always available" feel as the current bundled approach, but the data arrives via a ~200 KB JSON response instead of a 500+ KB JS chunk.

### 3.4 Page Component Changes

Each of the 82 page components (26 quiz + 29 mock exam + 27 flashcard) will be updated to:

1. Replace the static `import { QUESTIONS } from "@/lib/..."` with `const { questions, modules, isLoading } = useQuestionBank("bank-key")`.
2. Add a loading state (skeleton/spinner) while `isLoading` is true.
3. Remove the per-file type import and use a unified `Question` type exported from the hook.

**Before (current):**
```tsx
import { CLASS1_WATER_QUESTIONS, CLASS1_WATER_MODULES } from '@/lib/class1WaterQuestions';
// ...
const allQuestions = CLASS1_WATER_QUESTIONS;
```

**After (migrated):**
```tsx
import { useQuestionBank } from '@/hooks/useQuestionBank';
// ...
const { questions: allQuestions, modules, isLoading } = useQuestionBank("class1-water");
if (isLoading) return <QuizSkeleton />;
```

### 3.5 Backward Compatibility with `questionAttempts`

The existing `questionAttempts` table stores `questionId` (the per-bank sequential number) and `examType` (the bank key). The new `questions` table stores `questionNum` (same value) and `bankKey` (same value as `examType`). This means all existing attempt history, missed-question logic, and student profiles continue to work without any data migration. The `getMissedQuestions` procedure returns `questionNum` values, and the client can filter the fetched bank by those IDs.

---

## 4. Seed Script

A Node.js seed script (`server/seed-questions.mjs`) will parse each of the 26 TypeScript question files and insert the data into the `questions` and `question_bank_meta` tables. The script will:

1. Read each `.ts` file as text.
2. Extract the question array using a regex or by evaluating the exported constant (using `tsx` or a simple JSON extraction approach since the data is mostly JSON-compatible).
3. Normalize the field names (`correctAnswer` → `correctIndex`, `correct` → `correctIndex`).
4. Batch-insert rows in chunks of 500 using Drizzle's `db.insert().values([...])`.
5. Extract module lists, module targets, and formula links from each file and insert into `question_bank_meta`.

The mapping from file names to `bankKey` values:

| File | bankKey |
|---|---|
| class1Questions.ts | `oit` |
| class1WastewaterQuestions.ts | `oit-wastewater` |
| class1WaterQuestions.ts | `class1-water` |
| class2WaterQuestions.ts | `class2-water` |
| class2WastewaterQuestions.ts | `class2-wastewater` |
| class3WaterQuestions.ts | `class3-water` |
| class3WastewaterQuestions.ts | `class3-wastewater` |
| class4WaterQuestions.ts | `class4-water` |
| class4WastewaterQuestions.ts | `class4-wastewater` |
| wqaQuestions.ts | `wqa` |
| wpiClass1WaterQuestions.ts | `wpi-class1-water` |
| wpiClass1WastewaterQuestions.ts | `wpi-class1-wastewater` |
| wpiClass1WaterDistQuestions.ts | `wpi-class1-water-dist` |
| wpiClass1WastewaterCollQuestions.ts | `wpi-class1-wastewater-coll` |
| wpiClass2WaterQuestions.ts | `wpi-class2-water` |
| wpiClass2WastewaterQuestions.ts | `wpi-class2-wastewater` |
| wpiClass2WaterDistQuestions.ts | `wpi-class2-water-dist` |
| wpiClass2WastewaterCollQuestions.ts | `wpi-class2-wastewater-coll` |
| wpiClass3WaterQuestions.ts | `wpi-class3-water` |
| wpiClass3WastewaterQuestions.ts | `wpi-class3-wastewater` |
| wpiClass3WaterDistQuestions.ts | `wpi-class3-water-dist` |
| wpiClass3WastewaterCollQuestions.ts | `wpi-class3-wastewater-coll` |
| wpiClass4WaterQuestions.ts | `wpi-class4-water` |
| wpiClass4WastewaterQuestions.ts | `wpi-class4-wastewater` |
| wpiClass4WaterDistQuestions.ts | `wpi-class4-water-dist` |
| wpiClass4WastewaterCollQuestions.ts | `wpi-class4-wastewater-coll` |

These `bankKey` values match the `examType` strings already used in `questionAttempts`, ensuring backward compatibility.

---

## 5. Execution Plan

The migration is divided into 6 phases. Each phase produces a deployable checkpoint, so the application remains functional throughout.

### Phase 1: Schema & Seed (estimated: 1 session)

1. Add `questions` and `questionBankMeta` tables to `drizzle/schema.ts`.
2. Run `pnpm db:push` to create the tables.
3. Write and run `server/seed-questions.mjs` to populate all 14,000+ questions.
4. Verify row counts per bank match the source file counts.
5. Write a Vitest test that queries each bank and asserts the expected question count.

**Risk:** The TiDB database has a row-size limit. Each question row will be roughly 1–3 KB (explanation text is the largest field). With 14,000 rows, total storage is approximately 20–40 MB — well within limits.

### Phase 2: API Layer (estimated: 1 session)

1. Add `getQuestions` and `getBankMeta` procedures to `quizRouter`.
2. Create the `useQuestionBank` hook in `client/src/hooks/`.
3. Create a `QuizSkeleton` loading component for the loading state.
4. Write Vitest tests for both procedures (correct filtering, pagination, missing bank returns empty).
5. Verify the API response size and latency for the largest bank (class4WW, ~600 questions).

**Risk:** The largest bank response will be ~300–400 KB of JSON. This is comparable to the current JS chunk size but arrives as a single fetch after the page shell has already rendered, so perceived performance will be better. If latency is a concern, we can add server-side compression (gzip is already enabled on the Manus hosting platform).

### Phase 3: Migrate Quiz Pages (estimated: 1–2 sessions)

Update all 26 quiz page components to use `useQuestionBank` instead of static imports. This is the highest-impact phase because quiz pages are the most-visited pages.

The changes per file are mechanical and identical:
1. Remove the `import { QUESTIONS, MODULES } from "@/lib/..."` line.
2. Add `import { useQuestionBank } from "@/hooks/useQuestionBank"`.
3. Replace `const allQuestions = QUESTIONS` with destructured hook output.
4. Add early-return loading skeleton.
5. Normalize any `correctAnswer` → `correctIndex` references (the hook will return a unified shape).

Since all 26 files follow the same pattern, this can be done in a batch pass.

### Phase 4: Migrate Mock Exam Pages (estimated: 1 session)

Update all 29 mock exam page components. The pattern is similar to quiz pages, but mock exams also need `moduleTargets` from the bank metadata. The `useQuestionBank` hook already returns this.

For the 6 legacy mock exams that don't use `MockExamShell` (Class1MockExam, Class1WaterMockExam, OITMockExam, OITWastewaterMockExam, WQAMockExam, MockExam), the question import replacement is the same — they just have more inline logic.

### Phase 5: Migrate Flashcard Pages (estimated: 1 session)

Update all 27 flashcard page components. These pass the full question array as a prop to `FlashcardShell`. The migration replaces the static import with the hook and passes the hook's `questions` array as the prop. A loading state wraps the `FlashcardShell` render.

### Phase 6: Cleanup & Verification (estimated: 1 session)

1. Delete all 26 `*Questions*.ts` files from `client/src/lib/` (12 MB of source removed).
2. Delete the `wqaQuestions` re-export in `client/src/lib/questions.ts` if it exists.
3. Run `pnpm build` and verify the main bundle size has dropped from 2,158 KB to under 200 KB.
4. Run `pnpm test` and verify all 96+ tests still pass.
5. Run Lighthouse audit and confirm Performance score improvement.
6. Verify all quiz modes work end-to-end: Standard, Quick 10, Missed Questions, Timed, Calc Only, Module Filter.
7. Verify mock exams: question selection, timer, results, review mode with AI Tutor.
8. Verify flashcards: deck loading, known/unknown tracking, module filter.
9. Save final checkpoint and deploy.

---

## 6. Expected Impact

| Metric | Before | After (Projected) |
|---|---|---|
| Main JS bundle (gzip) | 593 KB | ~80–120 KB |
| Total JS transferred on landing page | 593 KB | ~80–120 KB (questions not loaded until quiz page visited) |
| First Contentful Paint | 7.4 s | ~2–3 s |
| Time to Interactive | 17.9 s | ~3–5 s |
| Lighthouse Performance | 26 | 60–80 (estimated) |
| Source files in `client/src/lib/` | 158,605 lines | ~2,000 lines (non-question files remain) |
| Question data location | Client JS bundle | Database (fetched on demand via API) |

The landing page will no longer load any question data at all. Question data will only be fetched when a user navigates to a specific quiz, mock exam, or flashcard page — and even then, only the relevant bank (400–600 questions) is loaded, not all 14,000.

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Database query latency adds perceptible delay to quiz page load | Medium | Medium | Set `staleTime: Infinity` so data is cached after first fetch. Show skeleton loading state. Largest bank (~600 questions) should return in <500ms. |
| Seed script incorrectly parses a question file | Low | High | Write per-bank row-count assertions. Spot-check 5 random questions per bank against source files. |
| `questionAttempts.questionId` values don't match `questions.questionNum` | Low | High | Both use the same per-bank sequential ID. Verify with a JOIN query after seeding. |
| TiDB row-size limit exceeded for questions with very long explanations | Very Low | Medium | Longest explanations are ~500 characters. TiDB's row-size limit is 6 MB. No risk. |
| Offline/slow-connection users lose access to questions | Low | Low | Questions are cached in React Query memory for the session. Could add service worker caching in a future iteration. |

---

## 8. Out of Scope (Future Iterations)

The following improvements are natural follow-ups but are not part of this migration:

1. **Migrate `moduleOverviews.ts` to the database** — another 648 KB file that could be fetched on demand.
2. **Server-side question randomization** — currently the client shuffles; could move to server for better security (prevents users from inspecting the full bank in DevTools).
3. **Incremental question loading** — instead of fetching the full bank, fetch questions one-at-a-time or in batches of 10. This would further reduce initial load but adds complexity to the missed-question and module-filter flows.
4. **Full-text search on questions** — with questions in the database, we could add a search feature for finding specific topics.
5. **Admin question editor** — CRUD interface for adding/editing questions without code changes.
