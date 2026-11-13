import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileApprovedOrLegacyRelease, committedReleasePath, committedReleaseSchema } from "../../../scripts/content-engine/committed-release";
import { activeCheckedReleases, trustedApproval } from "../../../scripts/content-engine/trusted-corpora";
import { compileLegacyRelease } from "./compiler";
import { InteractiveContentEngine } from "./loader";
import { interactiveModes, interactiveStartSessionInputSchema } from "../../../shared/interactiveSessions";

// Real committed payload and genuine prior AI-approval/pin declarations. No trust mocks.
const bank = committedReleaseSchema.parse(JSON.parse(readFileSync(committedReleasePath, "utf8")));
let root: string;
let engine: InteractiveContentEngine;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "echelon-shipped-oit-"));
  const compiled = compileApprovedOrLegacyRelease(root);
  expect(compiled.courseCount).toBe(38);
  expect(compiled.itemCount).toBe(3821);
  expect("newItemCount" in compiled ? compiled.newItemCount : 0).toBe(671);
  engine = new InteractiveContentEngine(root);
});
afterAll(() => { if (root) rmSync(root, { recursive: true, force: true }); });

describe("genuine shipped AI-reviewed OIT release", () => {
  it("activates exactly two OIT course pins and the independently reviewed full bank", () => {
    expect(Object.keys(activeCheckedReleases).sort()).toEqual(["oit", "oit-ww"]);
    const approval = trustedApproval(bank.approvalId)!;
    expect(approval.corpusSha256).toBe(bank.corpusSha256);
    expect(approval.selected).toEqual(bank.records.map(r => `${r.courseKey}/${r.example.id}`).sort());
    expect(approval.scope).toContain("No human technical review");
  });
  it.each(["oit", "oit-ww"])("serves full %s mode counts and unchanged legacy compatibility", courseKey => {
    const legacy = engine.getLegacyContent(courseKey, true);
    expect(legacy.examples).toHaveLength(courseKey === "oit" ? 103 : 107);
    expect(legacy.examples.every(e => !e.id.startsWith("oit100-"))).toBe(true);
    const catalog = engine.getCatalog(courseKey, true);
    for (const mode of interactiveModes) {
      const expected = legacy.examples.filter(e => e.mode === mode).length + bank.records.filter(r => r.courseKey === courseKey && r.example.mode === mode).length;
      expect(catalog.modes.find(m => m.mode === mode)?.totalCount).toBe(expected);
      const session = engine.startSession(interactiveStartSessionInputSchema.parse({ courseKey, mode, sessionSize: 50 }), true);
      expect(session.totalAvailableCount).toBe(expected);
      expect(session.examples).toHaveLength(Math.min(expected, 50));
      expect(new Set(session.examples.map(e => e.id)).size).toBe(session.examples.length);
      expect(session.examples.every(e => e.mode === mode)).toBe(true);
    }
  });
  it("keeps other courses unchanged and excludes 309A", () => {
    for (const key of ["class1-water", "class1-ww", "wqa"]) {
      expect(engine.getLegacyContent(key, true).examples.every(e => !e.id.startsWith("oit100-"))).toBe(true);
      expect(engine.getCatalog(key, true).available).toBe(true);
    }
    expect(() => engine.getCatalog("electrician-309a", true)).toThrow("Interactive content is unavailable.");
  });
  it("refuses accidentally dropping active checked content from a legacy-only build", () => {
    const destination = mkdtempSync(join(tmpdir(), "echelon-no-oit-bank-"));
    try { expect(() => compileLegacyRelease({ outputDir: destination })).toThrow(/Active checked release missing/); }
    finally { rmSync(destination, { recursive: true, force: true }); }
  });
});
