import { eq } from "drizzle-orm";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { databasePoolOptions } from "./_core/databaseTls";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: MySql2Database<Record<string, never>> | null = null;
let _pool: mysql.Pool | null = null;

/**
 * Tracks when the last failed connection attempt happened.
 * If a connection failed recently, getDb() returns null immediately
 * instead of blocking the request with another slow retry cycle.
 * The background keep-alive ping will attempt reconnection.
 */
let _lastFailedAt = 0;
const COOLDOWN_MS = 15_000; // Don't retry for 15s after a failure (matches TiDB cold-start time)
const EXTERNAL_CUTOVER_TARGET_ENV = "DATABASE_CUTOVER_USE_EXTERNAL_TARGET";
const EXTERNAL_CUTOVER_DATABASE_ENV = "DATABASE_CUTOVER_TARGET_DATABASE";
const DATABASE_NAME = /^[A-Za-z0-9_]+$/;

export function activeDatabaseSettings(environment = process.env) {
  const externalTarget = environment[EXTERNAL_CUTOVER_TARGET_ENV] === "true";
  let connectionString = externalTarget
    ? environment.EXTERNAL_DATABASE_URL
    : environment.DATABASE_URL;
  const caCertificate = externalTarget
    ? environment.EXTERNAL_DATABASE_CA
    : environment.DATABASE_SSL_CA;

  if (externalTarget && (!connectionString || !caCertificate)) {
    throw new Error("External database cutover requires the protected URL and CA certificate.");
  }
  if (externalTarget) {
    const finalDatabaseName = environment[EXTERNAL_CUTOVER_DATABASE_ENV];
    if (!finalDatabaseName || !DATABASE_NAME.test(finalDatabaseName)) {
      throw new Error("External database cutover requires a safe designated final database name.");
    }
    const externalUrl = new URL(connectionString!);
    externalUrl.pathname = `/${finalDatabaseName}`;
    connectionString = externalUrl.toString();
  }
  return {
    connectionString,
    caCertificate,
    requireTls: externalTarget || environment.DATABASE_REQUIRE_TLS === "true",
    label: externalTarget ? "external MySQL" : "current database",
  };
}

/**
 * Create a mysql2 connection pool with TiDB-friendly settings.
 */
function createPool(): mysql.Pool {
  const settings = activeDatabaseSettings();
  return mysql.createPool(
    databasePoolOptions(settings.connectionString!, {
      caCertificate: settings.caCertificate,
      requireTls: settings.requireTls,
      connectionLimit: 5,
      connectTimeout: 15_000,
    })
  );
}

/**
 * Get the database instance. Returns null immediately if:
 * - No DATABASE_URL configured
 * - A connection attempt failed within the last 15 seconds
 *
 * On first call (or after cooldown), attempts a single connection.
 * The background keep-alive ping handles reconnection after failures.
 */
export async function getDb() {
  // Already connected — fast path
  if (_db) return _db;
  if (!activeDatabaseSettings().connectionString) return null;

  // If we failed recently, don't block the request — return null immediately
  if (_lastFailedAt && Date.now() - _lastFailedAt < COOLDOWN_MS) {
    return null;
  }

  try {
    _pool = createPool();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _db = drizzle(_pool as any) as any;
    await _pool.query("SELECT 1");
    _lastFailedAt = 0; // Clear failure state
    console.log(`[Database] Connected to ${activeDatabaseSettings().label}`);
    return _db;
  } catch (error) {
    const msg = (error as Error).message || String(error);
    console.warn(`[Database] Connection failed: ${msg}`);
    _lastFailedAt = Date.now();
    // Clean up
    if (_pool) {
      _pool.end().catch(() => { /* ignore */ });
    }
    _db = null;
    _pool = null;
    return null;
  }
}

/**
 * Startup-only retry — called once when the server boots.
 * Retries 3 times with backoff to handle TiDB Serverless cold starts.
 * After this, all reconnection is handled by the background keep-alive.
 */
export async function connectWithRetry(): Promise<boolean> {
  if (!activeDatabaseSettings().connectionString) return false;

  const MAX_RETRIES = 3;
  const BACKOFF = [3000, 6000, 12000];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      _pool = createPool();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _db = drizzle(_pool as any) as any;
      await _pool.query("SELECT 1");
      _lastFailedAt = 0;
      console.log(`[Database] Connected to ${activeDatabaseSettings().label} (attempt ${i + 1})`);
      return true;
    } catch (error) {
      const msg = (error as Error).message || String(error);
      console.warn(`[Database] Startup attempt ${i + 1}/${MAX_RETRIES} failed: ${msg}`);
      if (_pool) _pool.end().catch(() => {});
      _db = null;
      _pool = null;
      if (i < MAX_RETRIES - 1) {
        console.log(`[Database] Retrying in ${BACKOFF[i]}ms...`);
        await new Promise(r => setTimeout(r, BACKOFF[i]));
      }
    }
  }

  _lastFailedAt = Date.now();
  console.error("[Database] All startup attempts failed. Will retry via keep-alive.");
  return false;
}

/**
 * Keep-alive ping — runs every 2 minutes.
 * When connected: keeps TiDB Serverless from hibernating.
 * When disconnected: attempts reconnection in the background.
 */
let _keepAliveInterval: ReturnType<typeof setInterval> | null = null;

export function startDbKeepAlive() {
  if (_keepAliveInterval) return;
  _keepAliveInterval = setInterval(async () => {
    if (_db && _pool) {
      // Already connected — just ping
      try {
        await _pool.query("SELECT 1");
      } catch (err) {
        console.warn("[Database] Keep-alive ping failed, resetting:", (err as Error).message);
        if (_pool) _pool.end().catch(() => {});
        _db = null;
        _pool = null;
        _lastFailedAt = Date.now();
      }
    } else {
      // Not connected — try to reconnect in background
      try {
        _pool = createPool();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _db = drizzle(_pool as any) as any;
        await _pool.query("SELECT 1");
        _lastFailedAt = 0;
        console.log("[Database] Reconnected to TiDB via keep-alive");
      } catch (err) {
        console.warn("[Database] Background reconnect failed:", (err as Error).message);
        if (_pool) _pool.end().catch(() => {});
        _db = null;
        _pool = null;
        _lastFailedAt = Date.now();
      }
    }
  }, 2 * 60 * 1000); // every 2 minutes
  if (_keepAliveInterval.unref) _keepAliveInterval.unref();
  console.log("[Database] Keep-alive started (every 2 min)");
}

/**
 * Force a reconnection attempt, bypassing the cooldown.
 * Used by the Heartbeat keepalive endpoint to ensure TiDB is always reachable.
 * Unlike getDb(), this always tries to connect even if a recent failure occurred.
 */
export async function forceReconnect(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;

  // If already connected, just ping to verify
  if (_db && _pool) {
    try {
      await _pool.query("SELECT 1");
      return true;
    } catch (err) {
      console.warn("[Database] forceReconnect ping failed, resetting:", (err as Error).message);
      if (_pool) _pool.end().catch(() => {});
      _db = null;
      _pool = null;
      _lastFailedAt = Date.now();
    }
  }

  // Clear the cooldown so we can attempt reconnection immediately
  _lastFailedAt = 0;

  try {
    _pool = createPool();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _db = drizzle(_pool as any) as any;
    await _pool.query("SELECT 1");
    _lastFailedAt = 0;
    console.log("[Database] forceReconnect: reconnected to TiDB");
    return true;
  } catch (error) {
    const msg = (error as Error).message || String(error);
    console.warn(`[Database] forceReconnect failed: ${msg}`);
    if (_pool) _pool.end().catch(() => {});
    _db = null;
    _pool = null;
    _lastFailedAt = Date.now();
    return false;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/** Update the province field for a logged-in user */
export async function updateUserProvince(userId: number, province: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user province: database not available");
    return;
  }
  await db.update(users).set({ province }).where(eq(users.id, userId));
}

// TODO: add feature queries here as your schema grows.
