/**
 * Retry wrapper for cron job functions.
 * Handles transient errors like ECONNRESET, ETIMEDOUT, connection pool exhaustion.
 */

const TRANSIENT_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EPIPE",
  "PROTOCOL_CONNECTION_LOST",
]);

function isTransient(err: unknown): boolean {
  if (err instanceof Error) {
    const code = (err as any).code;
    if (code && TRANSIENT_CODES.has(code)) return true;
    if (err.message?.includes("ECONNRESET")) return true;
    if (err.message?.includes("Too many connections")) return true;
    if (err.message?.includes("Connection lost")) return true;
  }
  return false;
}

/**
 * Retry a function up to `maxRetries` times with exponential backoff.
 * Only retries on transient errors (connection resets, timeouts, etc.).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2,
  baseDelayMs = 3000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isTransient(err)) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(
          `[${label}] Transient error on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delay}ms:`,
          err instanceof Error ? err.message : err,
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastError; // unreachable, but satisfies TS
}
