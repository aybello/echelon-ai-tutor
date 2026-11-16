/** The signed access token saved at sign-in, if it is a sensible size. The server verifies it on every request. */
export function readAccessToken(): string | undefined {
  try {
    const token = localStorage.getItem("echelon_access_token");
    if (!token || !token.trim() || token.length > 8192 || new TextEncoder().encode(token).length > 8192) return undefined;
    return token;
  } catch {
    return undefined;
  }
}
