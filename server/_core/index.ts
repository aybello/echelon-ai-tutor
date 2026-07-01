import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe/webhook";
import { generalLimiter, aiTutorLimiter, contactLimiter, authLimiter } from "../rateLimit";
import { startReconciliationJob } from "../jobs/reconcile";
import { startExamReminderJob } from "../jobs/examReminders";
import { startTriggerEngineJob } from "../jobs/triggerEngine";
import { startWelcomeEmailJob } from "../jobs/welcomeEmail";
import { connectWithRetry, startDbKeepAlive, getDb } from "../db";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust the first proxy (Cloudflare / load balancer) so req.ip reflects the real client IP
  app.set("trust proxy", 1);

  // Security headers — CSP off initially to avoid breaking Vite/inline scripts; tune later
  app.use(helmet({ contentSecurityPolicy: false }));

  // Register Stripe webhook BEFORE express.json() so raw body is preserved for signature verification
  registerStripeWebhook(app);

  // Cookie parser — required for req.cookies to be populated (used by email OTP session)
  app.use(cookieParser());

  // Body parser — uploads go to S3 via presigned URLs, so 1 MB is sufficient here.
  // Raise the limit on a specific route only if genuinely needed.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Rate limiting
  app.use("/api/trpc/tutor", aiTutorLimiter);     // AI Tutor — 15 req/min (LLM cost protection)
  app.use("/api/trpc/contact", contactLimiter);   // Contact form — 5 req/15min (spam protection)
  app.use("/api/trpc/auth", authLimiter);          // Auth — 10 req/min (brute force protection)
  app.use("/api/trpc/dashboardAuth", authLimiter); // Dashboard OTP — 10 req/min (brute force protection)
  app.use("/api/trpc/magicLink", authLimiter);     // Magic-link — 10 req/min (brute force protection)
  app.use("/api/trpc", generalLimiter);            // All API — 100 req/min (general protection)

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ── Health endpoint ────────────────────────────────────────────────────────
  // Public surface: returns only { status, ts } — no internal config details.
  // Internal details (db, stripe, email, ai checks) are only returned when the
  // caller provides the correct X-Health-Secret header matching ENV.cronSecret.
  app.get("/api/health", async (req, res) => {
    const internalSecret = ENV.cronSecret;
    const callerSecret = req.headers["x-health-secret"];
    const isInternal = internalSecret && callerSecret === internalSecret;

    let overallOk = true;
    const checks: Record<string, boolean | string> = {};

    // DB check
    try {
      const db = await getDb();
      checks.db = !!db;
      if (!db) overallOk = false;
    } catch {
      checks.db = false;
      overallOk = false;
    }

    // Stripe check
    const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
    checks.stripe = !!(stripeKey && stripeKey.startsWith("sk_"));
    if (!checks.stripe) overallOk = false;

    // Email provider check
    checks.email = !!(ENV.smtpHost && ENV.smtpUser);
    if (!checks.email) overallOk = false;

    // Cron secret check (warn only — not a hard failure)
    checks.cronSecret = !!ENV.cronSecret;

    // AI provider check
    checks.ai = !!(ENV.forgeApiKey && ENV.forgeApiUrl);
    if (!checks.ai) overallOk = false;

    const status = overallOk ? "ok" : "degraded";
    const httpStatus = overallOk ? 200 : 503;

    if (isInternal) {
      // Full details for internal callers (daily-health-check.mjs, monitoring)
      return res.status(httpStatus).json({ status, checks, ts: new Date().toISOString() });
    }

    // Public callers only see the aggregate status
    return res.status(httpStatus).json({ status, ts: new Date().toISOString() });
  });

  // ── FIX 4: One-click unsubscribe endpoint for reminder emails ────────────────
  // Accessible without authentication — the token IS the credential.
  app.get("/api/unsubscribe-reminder", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      return res.status(400).send("<html><body><h2>Invalid unsubscribe link.</h2></body></html>");
    }
    try {
      const db = await getDb();
      if (!db) return res.status(503).send("<html><body><h2>Service temporarily unavailable. Please try again later.</h2></body></html>");
      const { organizationMembers } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await db.select().from(organizationMembers)
        .where(eq(organizationMembers.unsubscribeToken, token)).limit(1);
      if (rows.length === 0) {
        return res.status(404).send("<html><body><h2>Unsubscribe link not found or already used.</h2></body></html>");
      }
      await db.update(organizationMembers)
        .set({ reminderOptOut: true })
        .where(eq(organizationMembers.unsubscribeToken, token));
      return res.send(`<html><head><meta charset='utf-8'><title>Unsubscribed</title><style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F1F5F9;}div{background:#fff;border-radius:12px;padding:40px;max-width:480px;text-align:center;box-shadow:0 2px 16px rgba(0,0,0,0.08);}h2{color:#15803D;margin:0 0 12px;}p{color:#475569;font-size:14px;line-height:1.6;}</style></head><body><div><div style='font-size:40px;margin-bottom:16px'>✅</div><h2>You've been unsubscribed</h2><p>You will no longer receive reminder emails from Echelon Institute for Teams. Your access to the platform is not affected.</p><p style='margin-top:20px;font-size:12px;color:#94A3B8;'>If this was a mistake, contact <a href='mailto:abello@echeloninstitute.ca' style='color:#1D4ED8;'>abello@echeloninstitute.ca</a></p></div></body></html>`);
    } catch (err) {
      console.error("[unsubscribe-reminder] Error:", err);
      return res.status(500).send("<html><body><h2>An error occurred. Please try again later.</h2></body></html>");
    }
  });

  // ── CRON_SECRET middleware — protects all /api/scheduled/* endpoints ────────
  // Ticket 10: In production, require x-cron-secret header to match ENV.cronSecret.
  // If ENV.cronSecret is empty (local dev), the check is skipped.
  app.use("/api/scheduled", (req, res, next) => {
    if (ENV.cronSecret && req.headers["x-cron-secret"] !== ENV.cronSecret) {
      return res.status(401).json({ error: "Unauthorized: missing or invalid x-cron-secret" });
    }
    return next();
  });

  // ── Platform-managed DB keep-alive endpoint ────────────────────────────────
  // This endpoint is called every 5 minutes by a Manus Heartbeat cron (set up
  // via manus-heartbeat CLI). Uses forceReconnect() which bypasses the cooldown
  // so it always attempts a real connection — fixing the 6-hour gap bug where
  // the cooldown blocked reconnection even after TiDB was ready.
  app.post("/api/scheduled/db-keepalive", async (req, res) => {
    try {
      const { forceReconnect } = await import("../db");
      const ok = await forceReconnect();
      return res.json({ ok, action: ok ? "ping" : "reconnect_failed", ts: new Date().toISOString() });
    } catch (err) {
      console.error("[keepalive] forceReconnect failed:", err);
      return res.status(500).json({ error: String(err), ts: new Date().toISOString() });
    }
  });

  // ── Job board refresh endpoint (Heartbeat cron, every 6 hours) ─────────────
  app.post("/api/scheduled/fetch-jobs", async (req, res) => {
    try {
      const taskUid = req.headers["x-manus-cron-task-uid"] as string | undefined;
      const { ingestAllFeeds } = await import("../scripts/fetchJobs.mjs" as string) as { ingestAllFeeds: () => Promise<{ inserted: number; skipped: number; total: number }> };
      const result = await ingestAllFeeds();
      console.log(`[fetch-jobs] ${result.inserted} inserted, ${result.skipped} skipped, ${result.total} total | taskUid=${taskUid}`);
      return res.json({ ok: true, ...result, ts: new Date().toISOString() });
    } catch (err) {
      console.error("[fetch-jobs] error:", err);
      return res.status(500).json({ error: String(err), ts: new Date().toISOString() });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Warm up the DB connection on startup so the first user request doesn't
    // hit a cold TiDB Serverless cluster (which can take 5-10s to wake).
    await connectWithRetry();
    startDbKeepAlive();
    // Start background jobs after server is listening
    startReconciliationJob();
    startExamReminderJob();
    startTriggerEngineJob();
    startWelcomeEmailJob();
  });
}

startServer().catch(console.error);
