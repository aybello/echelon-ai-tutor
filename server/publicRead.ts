import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
/** Do not collapse outages into empty results or expose database error details. */
export async function publicDatabaseRead<T>(label: "Jobs" | "Blog", read: (db: NonNullable<Awaited<ReturnType<typeof getDb>>>) => Promise<T>): Promise<T> {
  try {
    const db = await getDb();
    if (!db) throw new Error("unavailable");
    return await read(db);
  } catch {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: `${label} is temporarily unavailable. Please retry.` });
  }
}
