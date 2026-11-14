import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildOverlay, type CourseData } from "../../../scripts/game-authoring/build";
import { compileOverlays } from "./overlay";

const data: CourseData = {
  courseKey: "oit",
  facts: [["e", "A neutral sample has a pH of seven.", true, "A pH of seven is neutral."]],
  boards: [], oddSets: [], sequences: [], relations: [], flaws: [],
};

describe("unreviewed authoring drafts", () => {
  it("never manufactures reviewer metadata and the runtime schema rejects the draft", () => {
    const { doc, errors } = buildOverlay(data, "draft-test");
    expect(errors.join(" ")).toMatch(/Publication disabled.*no verified, payload-bound AI review receipts/);
    expect(doc.scope).toContain("Unreviewed draft");
    expect(doc.additions).toHaveLength(1);
    expect(doc.additions[0]).not.toHaveProperty("review");
    expect(() => compileOverlays([doc])).toThrow();
  });

  it("does not publish or overwrite a file even if a draft has no items", () => {
    const dir = mkdtempSync(join(tmpdir(), "game-authoring-gate-"));
    try {
      const input = join(dir, "data.mjs");
      const output = join(dir, "overlay.json");
      writeFileSync(input, `export default ${JSON.stringify({ ...data, facts: [] })};\n`);
      writeFileSync(output, "existing output must remain untouched\n");
      for (const flags of [[], ["--check"]]) {
        let failure: any;
        try {
          execFileSync(process.execPath, ["--require", resolve("scripts/test-safety.cjs"), "--import", "tsx", resolve("scripts/game-authoring/build.ts"), input, output, "draft-test", ...flags], { encoding: "utf8", env: process.env, stdio: "pipe" });
        } catch (error) { failure = error; }
        expect(failure?.status).toBe(1);
        expect(String(failure?.stdout)).toContain("Publication disabled");
        expect(readFileSync(output, "utf8")).toBe("existing output must remain untouched\n");
      }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
