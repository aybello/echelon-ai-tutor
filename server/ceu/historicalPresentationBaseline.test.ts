import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { historicalCeuPresentationSource } from "./historicalPresentationBaseline";
import media from "../../shared/ceuManagedMedia.json";

const root = resolve(import.meta.dirname, "../..");
const cssPath = "client/src/pages/ContinuingEducationCourse.css";
const tsxPath = "client/src/pages/ContinuingEducationCourse.tsx";
const css = readFileSync(resolve(root, cssPath), "utf8");
const tsx = readFileSync(resolve(root, tsxPath), "utf8");
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
function normalizeMedia(source: string) {
  for (const [oldPath, asset] of Object.entries(media)) source = source.replaceAll(asset.url, oldPath);
  return source;
}

describe("exact historical CEU presentation projection", () => {
  it("preserves the original reviewed stylesheet digest without updating it", () => {
    expect(sha(historicalCeuPresentationSource(cssPath, css))).toBe("3c791788f370ec2f7fda4b2c87d0d89162dad5a76d717accacbcef1f4803ae87");
  });
  it("preserves the original managed-media JSX content digest", () => {
    const baseline = JSON.parse(readFileSync(resolve(root, "server/ceu/fixtures/managed-media-baseline-7f604509.json"), "utf8"));
    expect(sha(historicalCeuPresentationSource(tsxPath, normalizeMedia(tsx)))).toBe(baseline[tsxPath]);
  });
  it("rejects altered or duplicated diagram declarations instead of stripping them broadly", () => {
    expect(() => historicalCeuPresentationSource(tsxPath, tsx.replace("[activeModule, slides]", "[activeModule]"))).toThrow();
    expect(() => historicalCeuPresentationSource(tsxPath, tsx + 'import CeuLearningDiagram from "@/components/CeuLearningDiagram";\n')).toThrow();
  });
  it("rejects any modified diagram stylesheet appendix", () => {
    expect(() => historicalCeuPresentationSource(cssPath, css.replace("margin: 28px 0 32px", "margin: 99px"))).toThrow();
  });
  it("leaves unrelated CSS changes visible to the original historical hash", () => {
    const original = historicalCeuPresentationSource(cssPath, css);
    expect(sha(historicalCeuPresentationSource(cssPath, css + "\n.unapproved { display: none; }\n"))).not.toBe(sha(original));
  });
  it("leaves unrelated JSX logic visible to the original historical hash", () => {
    const original = historicalCeuPresentationSource(tsxPath, tsx);
    expect(sha(historicalCeuPresentationSource(tsxPath, tsx + "\n// unapproved content change\n"))).not.toBe(sha(original));
  });
});
