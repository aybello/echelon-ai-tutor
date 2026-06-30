export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // SMTP email settings (optional — falls back to Ethereal test account if not set)
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: process.env.SMTP_PORT ?? "587",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  /**
   * Server-approved base URL for generating sensitive links (magic links, etc.).
   * Do NOT use client-provided origin for these — use this value instead.
   * Set APP_BASE_URL in production env; defaults to localhost in development.
   */
  appBaseUrl:
    process.env.APP_BASE_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://echeloninstitute.ca"
      : "http://localhost:3000"),
  /**
   * Secret token for protecting scheduled/cron endpoints (/api/scheduled/*).
   * Set CRON_SECRET in production env; if unset, cron endpoints are unprotected
   * (acceptable for local dev, not for production).
   */
  cronSecret: process.env.CRON_SECRET ?? "",
};
