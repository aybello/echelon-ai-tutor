import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { INDIVIDUAL_PRODUCTS } from "../shared/products";

const ROOT = new URL("..", import.meta.url);
const PUBLIC_WPI_COPY_FILES = [
  "client/src/pages/Landing.tsx",
  "client/src/pages/Pricing.tsx",
  "client/src/pages/WpiLanding.tsx",
] as const;

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, ROOT), "utf8");
}

const unsupportedAuthorityClaim =
  /\b(?:recognized|endorsed|approved|accredited)\s+(?:by|across|with)\b[^\n]{0,180}\b(?:EOCP|AWWOA|SAHO|MWWA)\b|\b(?:EOCP|AWWOA|SAHO|MWWA)\b[^\n]{0,180}\b(?:recognizes?|endorses?|approves?|accredits?)\b/i;

describe("public WPI marketing claims", () => {
  it("keeps WPI product descriptions factual and independent", () => {
    const wpiProducts = INDIVIDUAL_PRODUCTS.filter(product =>
      product.key.startsWith("wpi-"),
    );

    expect(wpiProducts).toHaveLength(16);

    for (const product of wpiProducts) {
      expect(product.description).toMatch(
        /(?:aligned with|designed around) (?:the )?WPI .*?(?:Need-to-Know Criteria|outline)/i,
      );
      expect(product.description).toMatch(
        /(?:independent preparation provider|confirm (?:your |the )?current.*requirements)/i,
      );
      expect(product.description).not.toMatch(unsupportedAuthorityClaim);
    }
  });

  it("does not imply that authorities recognize or endorse Echelon courses", () => {
    for (const relativePath of PUBLIC_WPI_COPY_FILES) {
      const content = source(relativePath);

      expect(content).not.toMatch(unsupportedAuthorityClaim);
      expect(content).not.toMatch(/recognized across western canada/i);
    }

    expect(source("client/src/pages/Pricing.tsx")).toContain(
      "Independent preparation aligned with published WPI Need-to-Know Criteria.",
    );
    expect(source("client/src/pages/WpiLanding.tsx")).toContain(
      "Echelon provides independent preparation aligned with published WPI Need-to-Know Criteria.",
    );
  });
});
