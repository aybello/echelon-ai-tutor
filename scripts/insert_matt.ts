import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { subscriptions } from "../drizzle/schema";
import { env } from "../server/_core/env";

async function main() {
  const conn = await mysql.createConnection(env.DATABASE_URL);
  const db = drizzle(conn);

  try {
    await db.insert(subscriptions).values({
      email: "matt.cooop@gmail.com",
      tier: "class1",
      province: "ontario",
      stripeSubscriptionId: "sub_1TeN46IZU5R5gvMswp7Y0cuh",
      stripeCustomerId: "cus_UdeM2wPp2FA7fA",
      status: "active",
      currentPeriodStart: new Date("2026-06-03T22:15:07Z"),
      currentPeriodEnd: new Date("2027-06-03T22:15:07Z"),
    });
    console.log("SUCCESS: Matt Cooper's subscription inserted");
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }

  await conn.end();
}

main();
