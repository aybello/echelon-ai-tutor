import type { z } from "zod";
import type { getDb } from "../db";
import type { recruitmentAnswerInput, recruitmentCreateInput, recruitmentStartInput, recruitmentSubmitInput } from "../../shared/recruitmentAssessment";

export type RecruitmentDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type RecruitmentTransaction = Parameters<Parameters<RecruitmentDb["transaction"]>[0]>[0];
export type RecruitmentReadDb = Pick<RecruitmentDb, "select">;
export type RecruitmentCreate = z.infer<typeof recruitmentCreateInput>;
export type RecruitmentStart = z.infer<typeof recruitmentStartInput>;
export type RecruitmentAnswer = z.infer<typeof recruitmentAnswerInput>;
export type RecruitmentSubmit = z.infer<typeof recruitmentSubmitInput>;
export type RecruitmentOperation =
  | { kind: "get" }
  | { kind: "start"; input: RecruitmentStart }
  | { kind: "answer"; input: RecruitmentAnswer }
  | { kind: "submit"; input: RecruitmentSubmit };
