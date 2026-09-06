import { TRPCError } from "@trpc/server";
import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { examResults, questionAttempts } from "../drizzle/schema";
import { resolveCourseKey } from "../shared/courseRegistry";

/** Course identity wins over old bank/history names. Never merge regulatory families. */
export function courseActivityScope(key: string) {
  const course = resolveCourseKey(key);
  if (!course) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown study course." });
  const keys = [...new Set([course.courseKey, course.questionBankKey, ...course.aliases])]
    .filter(key => key !== "class1"); // Historical combined bank requires stream evidence.
  return { course, keys };
}

function matchCourse(key: string, recordedKey: SQL, legacyStream: SQL) {
  const { course, keys } = courseActivityScope(key);
  const exact = inArray(recordedKey, keys);
  return ["class1-water", "class1-ww"].includes(course.courseKey)
    ? or(exact, and(eq(recordedKey, "class1"), legacyStream))!
    : exact;
}

export function attemptCourseFilter(key: string) {
  const { course } = courseActivityScope(key);
  const recordedKey = sql`COALESCE(NULLIF(${questionAttempts.courseKey}, ''), NULLIF(${questionAttempts.bankKey}, ''), ${questionAttempts.examType})`;
  // Old combined-bank rows without a course key can only be attributed when
  // their stored module identifies a stream. Ambiguous historical rows stay out.
  const topics = course.courseKey === "class1-ww"
    ? ["Wastewater Treatment", "Wastewater Collection"]
    : ["Water Treatment", "Water Distribution"];
  return matchCourse(key, recordedKey, inArray(questionAttempts.topic, topics));
}

export function examCourseFilter(key: string, stream?: "water" | "wastewater") {
  const resolvedKey = key === "class1" && stream === "wastewater" ? "class1-ww" : key;
  const { course } = courseActivityScope(resolvedKey);
  const recordedKey = sql`COALESCE(NULLIF(${examResults.courseKey}, ''), NULLIF(${examResults.bankKey}, ''), ${examResults.examType})`;
  return matchCourse(resolvedKey, recordedKey, eq(examResults.stream, course.courseKey === "class1-ww" ? "wastewater" : "water"));
}

export function attemptIdentityFilter(userId: number | null, email: string | null) {
  const normalized = email?.trim().toLowerCase();
  if (!userId && !normalized) throw new Error("A verified learner identity is required");
  return or(
    userId ? eq(questionAttempts.userId, userId) : undefined,
    normalized ? eq(questionAttempts.studentEmail, normalized) : undefined,
  )!;
}
