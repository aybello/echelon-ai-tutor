import { describe, expect, it } from "vitest";
import {
  scheduledSecretMatches,
  allowsUnauthenticatedScheduledRequest,
} from "./scheduledAuth";

describe("scheduled endpoint authorization", () => {
  describe("scheduledSecretMatches", () => {
    it("accepts the configured secret", () => {
      expect(scheduledSecretMatches("s3cret", "s3cret")).toBe(true);
    });

    it("rejects a wrong secret", () => {
      expect(scheduledSecretMatches("s3cret", "guess")).toBe(false);
    });

    it("rejects when no secret is configured, even if the caller sends one", () => {
      expect(scheduledSecretMatches("", "anything")).toBe(false);
      expect(scheduledSecretMatches("", "")).toBe(false);
    });

    it("rejects a missing or repeated header rather than coercing it", () => {
      expect(scheduledSecretMatches("s3cret", undefined)).toBe(false);
      expect(scheduledSecretMatches("s3cret", ["s3cret", "s3cret"])).toBe(false);
    });
  });

  describe("allowsUnauthenticatedScheduledRequest", () => {
    it("allows the bypass only in local development with no secret set", () => {
      expect(allowsUnauthenticatedScheduledRequest("", "development")).toBe(true);
    });

    it("never allows the bypass once a secret is configured", () => {
      for (const env of ["development", "production", "test", undefined]) {
        expect(allowsUnauthenticatedScheduledRequest("s3cret", env)).toBe(false);
      }
    });

    // The regression this guards: the original check was `NODE_ENV !== "production"`,
    // which failed open for every environment below.
    it.each([
      ["production", "production"],
      ["unset", undefined],
      ["empty", ""],
      ["misspelled prod", "prod"],
      ["capitalised", "Production"],
      ["staging", "staging"],
      ["test", "test"],
    ])("fails closed with no secret when NODE_ENV is %s", (_label, env) => {
      expect(allowsUnauthenticatedScheduledRequest("", env)).toBe(false);
    });
  });
});
