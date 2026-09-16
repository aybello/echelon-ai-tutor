import type { Request, Response } from "express";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import { clearVerifiedEmailSessionCookie } from "./emailSession";

/** End both supported identities, regardless of which login screen was used. */
export function clearIdentityCookies(req: Request, res: Response): void {
  // SameSite is not part of cookie identity. Lax also permits deletion on local
  // HTTP, where browsers reject SameSite=None without Secure.
  res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), sameSite: "lax" });
  clearVerifiedEmailSessionCookie(res);
}
