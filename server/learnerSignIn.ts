import type { Request } from "express";
import { persistAnalyticsEvent } from "./analytics";

export type SignInMethod = "oauth" | "email_otp" | "dashboard_otp" | "legacy_magic_link";
/** Call only after a successful explicit authentication, never during hydration. */
export async function recordLearnerSignIn(req: Pick<Request, "headers">, identity: { userId?: number; email?: string | null; openId?: string }, method: SignInMethod) {
  try {
    if (req.headers.dnt === "1" || req.headers["sec-gpc"] === "1") return;
    const permitted = method === "oauth"
      ? /(?:^|;\s*)echelon_activity_preference=allowed(?:;|$)/.test(String(req.headers.cookie ?? ""))
      : req.headers["x-echelon-activity"] === "allowed";
    if (!permitted || (!identity.userId && !identity.email && !identity.openId)) return;
    if (identity.openId) {
      const { getUserByOpenId } = await import("./db");
      identity = { userId: (await getUserByOpenId(identity.openId))?.id };
      if (!identity.userId) return;
    }
    if (!identity.userId && identity.email) {
      const { getUserByEmail } = await import("./db");
      const account = await getUserByEmail(identity.email);
      if (account?.id) identity = { ...identity, userId: account.id };
    }
    await persistAnalyticsEvent({ event: "login", ts: new Date().toISOString(),
      userId: identity.userId ? String(identity.userId) : null,
      email: identity.email?.trim().toLowerCase() || null,
      extra: { method, activityVersion: 1 },
    });
  } catch { /* Reporting must never interrupt successful authentication. */ }
}
