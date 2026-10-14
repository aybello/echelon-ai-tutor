import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { ipKeyGenerator } from "express-rate-limit";

/** Additional per-procedure guard: HTTP batching cannot multiply submissions.
 * Bounded, process-local defense, like the existing Express limiters; a shared
 * deployment-wide rate-limit store is still needed for multiple replicas.
 */
export function createMunicipalRequestThrottle() {
  const buckets = new Map<string, { count: number; until: number }>();
  return (ip: string, email: string, now = Date.now()) => {
    for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
    const keys = [["ip:" + ipKeyGenerator(ip), 5], ["email:" + email.trim().toLowerCase(), 3]] as const;
    const hashed = keys.map(([key, max]) => [createHash("sha256").update(key).digest("hex"), max] as const);
    if (buckets.size >= 10_000 || hashed.some(([key, max]) => (buckets.get(key)?.count ?? 0) >= max)) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests. Please wait 15 minutes before trying again." });
    }
    for (const [key] of hashed) {
      const bucket = buckets.get(key) ?? { count: 0, until: now + 15 * 60_000 };
      bucket.count += 1;
      buckets.set(key, bucket);
    }
  };
}

export const checkMunicipalRequestThrottle = createMunicipalRequestThrottle();
