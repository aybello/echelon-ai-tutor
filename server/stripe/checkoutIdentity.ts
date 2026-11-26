import { normalizeEmail } from "../_core/access";
import type { TrpcContext } from "../_core/context";
/** A receipt URL is payment evidence, never proof of ownership of an email. */
export function checkoutIdentityMatches(
  ctx: Pick<TrpcContext, "user" | "studentEmail">,
  purchaserEmail: string
) {
  const identities = [ctx.user?.email, ctx.studentEmail]
    .filter(Boolean)
    .map(normalizeEmail);
  return (
    identities.length > 0 &&
    identities.every(email => email === normalizeEmail(purchaserEmail))
  );
}

export function validatedPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const phone = value.trim(),
    digits = phone.replace(/\D/g, "");
  return /^\+?[\d\s().-]+$/.test(phone) &&
    digits.length >= 7 &&
    digits.length <= 15
    ? phone
    : null;
}
