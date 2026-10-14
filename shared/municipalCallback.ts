import { z } from "zod";

export const MUNICIPAL_CALLBACK_NOTICE_VERSION = "municipal-request-callback-2026-10-14";
export const MUNICIPAL_CALLBACK_NOTICE = "You may call me about this request at the number above. This does not subscribe me to promotional calls or texts.";
const PREFIX = "[ECHELON_CALLBACK_V1]";
const evidence = z.object({
  phone: z.string().min(7).max(32),
  preferredTime: z.string().max(120),
  acceptedAt: z.iso.datetime(),
  noticeVersion: z.literal(MUNICIPAL_CALLBACK_NOTICE_VERSION),
});

/** First-line server-authored evidence, retained in the existing durable inquiry. */
export function municipalCallbackHeader(phone: string, preferredTime: string, now = new Date()): string {
  return PREFIX + JSON.stringify(evidence.parse({ phone, preferredTime, acceptedAt: now.toISOString(), noticeVersion: MUNICIPAL_CALLBACK_NOTICE_VERSION }));
}

export function readMunicipalCallback(message: string | null) {
  const first = message?.split("\n", 1)[0];
  if (!first?.startsWith(PREFIX)) return null;
  try {
    const parsed = evidence.safeParse(JSON.parse(first.slice(PREFIX.length)));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

/** Retry comparison ignores only the new server receipt time. All submitted
 * details and permission evidence must still match; the first time is kept.
 */
export function comparableMunicipalMessage(message: string): string {
  const callback = readMunicipalCallback(message);
  if (!callback) return message;
  return JSON.stringify({ ...callback, acceptedAt: undefined }) + message.slice(message.indexOf("\n"));
}
