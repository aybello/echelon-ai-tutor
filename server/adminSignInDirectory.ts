import { and, count, desc, eq, isNull, lt, lte, max } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { accountSignIns as signIns, users } from "../drizzle/schema";
import type { LearnerOption, LearnerSelection } from "../shared/learnerActivity";
import { getDb } from "./db";

const PAGE_SIZE = 25;
export const signInMethods = { oauth: "OAuth", email_otp: "Email OTP", dashboard_otp: "Dashboard OTP", legacy_magic_link: "Legacy magic link" } as const;
export type SignInPageCursor = { snapshot: number; before: number };

async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sign-in directory unavailable" });
  return db;
}

export async function listSignInPeople(cursor?: SignInPageCursor) {
  const db = await database();
  const lastId = max(signIns.id);
  // Bound the source rows before grouping so repeat visits cannot reorder earlier pages.
  const people = db.select({
    userId: signIns.userId, email: signIns.verifiedEmail,
    latestId: lastId.mapWith(Number).as("latest_id"), visits: count().as("visits"),
  }).from(signIns).where(cursor && lte(signIns.id, cursor.snapshot))
    .groupBy(signIns.userId, signIns.verifiedEmail)
    .having(cursor ? lt(lastId, cursor.before) : undefined)
    .orderBy(desc(lastId)).limit(PAGE_SIZE + 1).as("people");
  const rows = await db.select({
    userId: people.userId, email: people.email, accountEmail: users.email, accountName: users.name,
    id: people.latestId, count: people.visits, at: signIns.signedInAt, method: signIns.method,
  }).from(people).innerJoin(signIns, eq(signIns.id, people.latestId))
    .leftJoin(users, eq(users.id, people.userId)).orderBy(desc(people.latestId));
  const items = rows.slice(0, PAGE_SIZE).map(row => {
    const learner: LearnerOption = row.userId !== null
      ? { key: `user:${row.userId}`, selection: { userId: row.userId }, name: row.accountName, email: row.accountEmail }
      : { key: `email:${row.email}`, selection: { email: row.email! }, name: null, email: row.email };
    return { learner, signInId: row.id, count: row.count, at: row.at, method: signInMethods[row.method] };
  });
  const next = rows.length > PAGE_SIZE ? { snapshot: cursor?.snapshot ?? items[0].signInId, before: items[PAGE_SIZE - 1].signInId } : null;
  return { items, next };
}

export async function listSignIns(learner: LearnerSelection, before?: number) {
  const db = await database();
  const identity = "userId" in learner ? eq(signIns.userId, learner.userId)
    : and(isNull(signIns.userId), eq(signIns.verifiedEmail, learner.email));
  const rows = await db.select({ id: signIns.id, at: signIns.signedInAt, method: signIns.method }).from(signIns)
    .where(and(identity, before ? lt(signIns.id, before) : undefined))
    .orderBy(desc(signIns.id)).limit(PAGE_SIZE + 1);
  return { items: rows.slice(0, PAGE_SIZE).map(row => ({ ...row, method: signInMethods[row.method] })),
    next: rows.length > PAGE_SIZE ? rows[PAGE_SIZE - 1].id : null };
}
