import type { Request } from "express";
import { persistAnalyticsEvent } from "./analytics";
import { getDb, getUserByOpenId } from "./db";
import { accountSignIns } from "../drizzle/schema";

export type SignInMethod = "oauth" | "email_otp" | "dashboard_otp" | "legacy_magic_link";
/** Called after credential verification and signing, before releasing the session cookie. */
export async function recordLearnerSignIn(req: Pick<Request, "headers">, identity: { email?: string; openId?: string }, method: SignInMethod) {
  const db = await getDb();
  if (!db) throw new Error("Unable to record account access");
  const userId = method === "oauth" && identity.openId ? (await getUserByOpenId(identity.openId))?.id ?? null : null;
  const email = method !== "oauth" ? identity.email?.trim().toLowerCase() || null : null;
  if (!userId && !email) throw new Error("Verified sign-in identity unavailable");
  const signedInAt = new Date();
  await db.insert(accountSignIns).values({ userId, verifiedEmail: email, method, signedInAt });
  // Optional metrics stay separate from the operational access log.
  try {
    if (req.headers.dnt === "1" || req.headers["sec-gpc"] === "1") return;
    const permitted = method === "oauth"
      ? /(?:^|;\s*)echelon_activity_preference=allowed(?:;|$)/.test(String(req.headers.cookie ?? ""))
      : req.headers["x-echelon-activity"] === "allowed";
    if (!permitted) return;
    await persistAnalyticsEvent({ event: "login", ts: signedInAt.toISOString(),
      userId: userId ? String(userId) : null,
      email,
      extra: { method, activityVersion: 1 },
    });
  } catch { /* Reporting must never interrupt successful authentication. */ }
}
