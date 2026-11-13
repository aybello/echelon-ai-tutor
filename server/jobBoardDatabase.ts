import type { ConnectionOptions } from "mysql2";
import { activeDatabaseSettings } from "./db";
import { databasePoolOptions } from "./_core/databaseTls";
import { databaseWritesFrozen } from "./_core/databaseCutover";

/** The feed must write to exactly the store read by jobsRouter, never a legacy URL. */
export function jobBoardConnectionOptions(
  environment: NodeJS.ProcessEnv = process.env
): ConnectionOptions {
  if (databaseWritesFrozen(environment)) {
    throw new Error("Job refresh is unavailable during database maintenance.");
  }
  const settings = activeDatabaseSettings(environment);
  if (!settings.connectionString) throw new Error("Job refresh database is not configured.");
  const { connectionLimit, waitForConnections, queueLimit, ...connection } =
    databasePoolOptions(settings.connectionString, {
      caCertificate: settings.caCertificate,
      requireTls: settings.requireTls,
      connectTimeout: 15_000,
    });
  return connection;
}
