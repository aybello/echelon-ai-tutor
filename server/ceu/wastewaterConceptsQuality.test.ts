import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ceuCourse } from "./catalogue";
import { CEU_COURSES } from "../../shared/ceuCourses";

const course = ceuCourse("ceu-wastewater-treatment-concepts")!;
const metadata = CEU_COURSES.find(c => c.key === course.key)!;
const root = resolve(import.meta.dirname, "../..");

function diagramBars() {
  const svg = course.modules[0].lesson.match(/<svg\b[\s\S]*?<\/svg>/)?.[0] ?? "";
  return [...svg.matchAll(/<rect\b([^>]*)\/>/g)].map(([, raw]) => {
    const attrs = Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
    return { x: Number(attrs.x), y: Number(attrs.y), height: Number(attrs.height) };
  });
}

describe("Wastewater concepts educational quality", () => {
  it("classifies municipal wastewater as a jurisdiction-neutral foundation without awarded credit", () => {
    expect(course.stream).toBe("wastewater");
    expect(metadata.stream).toBe("wastewater");
    expect(metadata.group).toBe("foundations");
    expect(metadata.regionLabel).toBe("Operator foundations");
    expect(metadata.approvalStatus).toBe("not_submitted");
    expect(metadata.publicDisclosure).toContain("No approved CEUs or regulatory recognition are awarded");
    expect(metadata.publicDisclosure).toContain("has not been submitted for approval in any jurisdiction");
    expect(course.delivery).toContain("no contact-hour award is made");
  });

  it("points every module to wastewater references that cover its topics", () => {
    const ids = new Set(course.sources.map(source => source.id));
    expect(ids.has("wi-basic-wastewater")).toBe(true);
    expect(ids.has("wi-suspended-growth")).toBe(true);
    expect(ids.has("epa-wastewater-uv")).toBe(true);
    for (const module of course.modules) {
      expect(module.sourceIds.length).toBeGreaterThan(0);
      expect(module.sourceIds.every(id => ids.has(id))).toBe(true);
      expect(module.sourceIds).not.toContain("wi-sw-guide");
      expect(module.sourceIds).not.toContain("ca-t-range");
    }
    expect(course.modules[2].sourceIds).toContain("wi-suspended-growth");
    expect(course.modules[3].sourceIds).toContain("epa-wastewater-uv");
  });

  it("draws storm flow higher and storm concentration lower with a shared baseline", () => {
    const bars = diagramBars();
    expect(bars).toHaveLength(4);
    const at = (x: number) => bars.find(bar => bar.x === x)!;
    for (const bar of bars) expect(bar.y + bar.height).toBe(200);
    expect(at(220).height).toBeGreaterThan(at(40).height);
    expect(at(280).height).toBeLessThan(at(100).height);
    expect(at(220).height / at(40).height).toBe(2);
    expect(at(280).height / at(100).height).toBe(0.5);
    expect(course.modules[0].lesson).toContain("This is not the Pinecrest scenario below");
    // The illustrative constant-load case must match Q x C on a common scale.
    expect(at(40).height * at(100).height).toBe(at(220).height * at(280).height);
  });

  it("teaches the increased BOD load in the separately stated Pinecrest storm scenario", () => {
    const module = course.modules[0];
    expect(module.evidence).toMatch(/flow doubled/);
    expect(module.evidence).toMatch(/fell by about a third/);
    const normalizedStormLoad = 2 * (1 - 1 / 3);
    expect(normalizedStormLoad).toBeCloseTo(4 / 3);
    expect(module.assignment).toContain("load rose by about a third");
    expect(module.assignment).not.toContain("load may have stayed about the same");
    expect(module.facilitatorGuide).toContain("2 × (2/3) = 4/3");
  });

  it("keeps both managed concept covers in catalogue generation", () => {
    const generator = readFileSync(resolve(root, "scripts/ceu/generateCatalogue.mjs"), "utf8");
    for (const key of ["ceu-water-treatment-concepts", "ceu-wastewater-treatment-concepts"]) {
      const publicCourse = CEU_COURSES.find(c => c.key === key)!;
      expect(publicCourse.cover?.src).toMatch(/^\/manus-storage\//);
      expect(generator).toContain(publicCourse.cover!.src);
    }
  });

  it("keeps generated public metadata reproducible without stripping managed covers", () => {
    expect(() => execFileSync(process.execPath, ["scripts/ceu/generateCatalogue.mjs", "--check"], { cwd: root, env: process.env, stdio: "pipe", timeout: 15000 })).not.toThrow();
  });
});
