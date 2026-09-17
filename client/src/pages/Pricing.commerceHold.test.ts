import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Pricing.tsx", import.meta.url), "utf8");

describe("Pricing Team commerce hold", () => {
  it("does not describe Team checkout or volume discounts as currently available", () => {
    expect(source).toContain("Team purchasing is temporarily paused");
    expect(source).toContain("View team launch details");
    expect(source).not.toContain("Volume discounts begin at 10 annual operator licences.");
    expect(source).not.toContain("Volume discounts apply automatically at checkout.");
  });

  it("routes the Team buyer path to the held Team launch page", () => {
    expect(source).toContain('window.location.href = "/teams"');
  });
});
