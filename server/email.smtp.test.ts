import { describe, expect, it } from "vitest";
import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

describe("SMTP email configuration", () => {
  it("should have SMTP credentials configured", () => {
    expect(ENV.smtpHost).toBeTruthy();
    expect(ENV.smtpUser).toBeTruthy();
    expect(ENV.smtpPass).toBeTruthy();
    expect(ENV.smtpPort).toBeTruthy();
  });

  it("should be able to create a nodemailer transporter with the configured credentials", () => {
    const transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: Number(ENV.smtpPort ?? 587),
      secure: Number(ENV.smtpPort ?? 587) === 465,
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
    expect(transporter).toBeDefined();
    // Verify the transport options are set correctly
    const options = transporter.options as Record<string, unknown>;
    expect(options.host).toBe("smtp.gmail.com");
    expect(options.port).toBe(587);
  });
});
