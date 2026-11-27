import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { questions } from "../../drizzle/schema";
import { validRecruitmentQuestions, type RecruitmentQuestion } from "../../shared/recruitmentAssessment";
import { learnerVisibleQuestionFilter } from "../questionGovernance";
import type { RecruitmentReadDb } from "./types";

export type RecruitmentBankRow = { id: number; module: string; question: string; options: string; correctIndex: number };

/** Malformed content is excluded before catalog counts and sampling, never trusted as JSON. */
export function usableRecruitmentQuestion(row: RecruitmentBankRow): RecruitmentQuestion | null {
  let options: unknown;
  try { options = JSON.parse(row.options); } catch { return null; }
  if (!Number.isSafeInteger(row.id) || row.id <= 0 || !Array.isArray(options)) return null;
  const question: RecruitmentQuestion = {
    id: String(row.id), module: row.module, prompt: row.question,
    options: options as string[], correctIndex: row.correctIndex,
  };
  return validRecruitmentQuestions([question]) ? question : null;
}

/** getDb's authoritative question table; no fixtures, bundle fallback or preview content. */
export async function loadRecruitmentPool(db: RecruitmentReadDb, bankKey: string): Promise<RecruitmentQuestion[]> {
  const rows = await db.select({ id: questions.id, module: questions.module, question: questions.question, options: questions.options, correctIndex: questions.correctIndex })
    .from(questions).where(and(eq(questions.bankKey, bankKey), learnerVisibleQuestionFilter()))
    .orderBy(questions.id);
  return rows.map(usableRecruitmentQuestion).filter((q): q is RecruitmentQuestion => q !== null);
}

export async function loadRecruitmentPools(db: RecruitmentReadDb, bankKeys: string[]): Promise<Map<string, RecruitmentQuestion[]>> {
  const pools = new Map<string, RecruitmentQuestion[]>();
  if (!bankKeys.length) return pools;
  const rows = await db.select({ bankKey: questions.bankKey, id: questions.id, module: questions.module, question: questions.question, options: questions.options, correctIndex: questions.correctIndex })
    .from(questions).where(and(inArray(questions.bankKey, [...new Set(bankKeys)]), learnerVisibleQuestionFilter())).orderBy(questions.id);
  for (const row of rows) {
    const q = usableRecruitmentQuestion(row);
    if (!q) continue;
    const group = pools.get(row.bankKey) ?? [];
    group.push(q); pools.set(row.bankKey, group);
  }
  return pools;
}

export function assertRecruitmentSnapshot(value: RecruitmentQuestion[]): RecruitmentQuestion[] {
  if (!Array.isArray(value) || value.length < 5 || value.length > 100
    || value.some(q => !q || typeof q !== "object") || !validRecruitmentQuestions(value)) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Assessment content is unavailable. Contact the hiring team." });
  }
  return value;
}
