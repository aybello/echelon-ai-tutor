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
import { connectWithRetry, startDbKeepAlive, getDb } from "../db";

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
  app.use("/api/trpc/ai", aiTutorLimiter);       // AI Tutor — 15 req/min (LLM cost protection)
  app.use("/api/trpc/contact", contactLimiter);   // Contact form — 5 req/15min (spam protection)
  app.use("/api/trpc/auth", authLimiter);          // Auth — 10 req/min (brute force protection)
  app.use("/api/trpc/dashboardAuth", authLimiter); // Dashboard OTP — 10 req/min (brute force protection)
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
  app.get("/api/health", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ status: "degraded", db: false, ts: new Date().toISOString() });
      return res.json({ status: "ok", db: true, ts: new Date().toISOString() });
    } catch {
      return res.status(503).json({ status: "error", db: false, ts: new Date().toISOString() });
    }
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
  });
}

startServer().catch(console.error);
