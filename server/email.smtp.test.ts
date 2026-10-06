import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";

describe("SMTP email configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("SMTP_HOST", "127.0.0.1");
    vi.stubEnv("SMTP_PORT", "1025");
    vi.stubEnv("SMTP_USER", "smtp-synthetic@example.test");
    vi.stubEnv("SMTP_PASS", "synthetic-placeholder");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("should have SMTP credentials configured", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.smtpHost).toBeTruthy();
    expect(ENV.smtpUser).toBeTruthy();
    expect(ENV.smtpPass).toBeTruthy();
    expect(ENV.smtpPort).toBeTruthy();
  });

  it("should be able to create a nodemailer transporter with the configured credentials", async () => {
    const { ENV } = await import("./_core/env");
    const transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: Number(ENV.smtpPort ?? 587),
      secure: Number(ENV.smtpPort ?? 587) === 465,
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    expect(transporter).toBeDefined();
    // Verify the transport options are set correctly
    const options = transporter.options as Record<string, unknown>;
    expect(options.host).toBe("127.0.0.1");
    expect(options.port).toBe(1025);
    expect(options.disableFileAccess).toBe(true);
    expect(options.disableUrlAccess).toBe(true);
    transporter.close();
  });
});
