import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import rawManifest from "./wastewaterMockAreaManifest.json";
import { createWastewaterMockAreaResolver, wastewaterMockAreaManifestSchema, wastewaterMockContentSha256, type ClassifiedWastewaterQuestion } from "./wastewaterMockAreaResolver";
import { WASTEWATER_MOCK_AREAS as areas } from "../shared/ontarioWastewaterMock";

const example: ClassifiedWastewaterQuestion = {
  id: 900001, module: "Synthetic mixed chapter", question: "Inspect the synthetic drive.",
  options: ["Inspect coupling", "Change dose", "Take sample", "File report"], correctIndex: 0,
  blueprintObjective: "A generic unapproved objective", reviewStatus: "unreviewed",
};
function fixture() {
  const manifest = structuredClone(rawManifest);
  manifest.banks["class1-wastewater"] = {
    entries: { "900001": { sha256: wastewaterMockContentSha256(example), area: "equipment" } },
    excludedQuestionNums: [900002],
  } as any;
  manifest.banks["class2-wastewater"] = { entries: {}, excludedQuestionNums: [] } as any;
  return manifest;
}

describe("hash-bound AI-assisted wastewater task-area metadata", () => {
  it("accepts only the strict schema and honest task-area provenance", () => {
    expect(wastewaterMockAreaManifestSchema.parse(rawManifest)).toEqual(rawManifest);
    for (const mutate of [
      (m: any) => { m.version = 2; },
      (m: any) => { m.provenance.source = "Human approved"; },
      (m: any) => { m.provenance.reviewStatus = "approved"; },
      (m: any) => { m.provenance.providerResponseId = "must-not-ship"; },
      (m: any) => { m.banks["class1-wastewater"].entries["900001"].sha256 = "bad"; },
      (m: any) => { m.banks["class1-wastewater"].entries["900001"].area = "unknown"; },
      (m: any) => { m.banks["class1-wastewater"].entries["01"] = m.banks["class1-wastewater"].entries["900001"]; },
      (m: any) => { m.banks["class1-wastewater"].excludedQuestionNums.push(900002); },
      (m: any) => { m.banks["class1-wastewater"].excludedQuestionNums.push(900001); },
    ]) {
      const invalid = fixture(); mutate(invalid);
      expect(wastewaterMockAreaManifestSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("hashes the versioned exact-content tuple, including option order and whitespace", () => {
    // Independently calculated SHA-256 golden vector (synthetic content only).
    expect(wastewaterMockContentSha256(example)).toBe("3d73c9ead7243c50db4af38cb44cfdab38ae3901344c62678a844578fc93d683");
    const digest = wastewaterMockContentSha256(example);
    for (const changed of [
      { ...example, question: example.question + " " },
      { ...example, options: [...example.options].reverse() },
      { ...example, options: [example.options[0] + " ", ...example.options.slice(1)] },
      { ...example, correctIndex: 1 },
      { ...example, module: areas.equipment },
    ]) expect(wastewaterMockContentSha256(changed)).not.toBe(digest);
    expect(wastewaterMockContentSha256({ ...example, id: 900003, reviewStatus: "approved", blueprintObjective: areas.safety })).toBe(digest);
  });

  it("gives exact hash-matched metadata priority without promoting governance or changing content", () => {
    const resolve = createWastewaterMockAreaResolver(fixture());
    const before = structuredClone(example);
    expect(resolve("class1-wastewater", example)).toBe(areas.equipment);
    expect(resolve("class1-wastewater", { ...example, reviewStatus: "approved", blueprintObjective: areas.safety })).toBe(areas.equipment);
    expect(example).toEqual(before);
    expect(example.reviewStatus).toBe("unreviewed");
    expect(resolve("class2-wastewater", example)).toBeNull();
    expect(resolve("wpi-class1-wastewater", example)).toBeNull();
  });

  it("never rescues changed classified content via approved objectives or legacy module aliases", () => {
    const resolve = createWastewaterMockAreaResolver(fixture());
    for (const change of [{ question: "Changed" }, { options: ["Different", "B", "C", "D"] }, { correctIndex: 2 }, { module: areas.equipment }]) {
      expect(resolve("class1-wastewater", { ...example, ...change, blueprintObjective: areas.equipment, reviewStatus: "approved" })).toBeNull();
    }
    expect(resolve("class1-wastewater", { ...example, id: 900002, module: areas.equipment, blueprintObjective: areas.equipment, reviewStatus: "approved" })).toBeNull();
    expect(resolve("class1-wastewater", { ...example, id: Number.NaN })).toBeNull();
  });

  it("retains approved exact objectives and known legacy areas only outside the snapshot", () => {
    const resolve = createWastewaterMockAreaResolver(fixture());
    const outside = { ...example, id: 900003, blueprintObjective: null };
    expect(resolve("class1-wastewater", { ...outside, module: areas.laboratory })).toBe(areas.laboratory);
    expect(resolve("class2-wastewater", { ...outside, module: "Equipment O&M" })).toBe(areas.equipment);
    expect(resolve("class1-wastewater", { ...outside, blueprintObjective: areas.safety, reviewStatus: "approved" })).toBe(areas.safety);
    expect(resolve("class1-wastewater", { ...outside, blueprintObjective: areas.safety, reviewStatus: "unreviewed" })).toBeNull();
    expect(resolve("class1-wastewater", outside)).toBeNull();
  });

  it("ships only identities, hashes and task areas, with a unique complete scoped snapshot partition", () => {
    const expected = { "class1-wastewater": { equipment: 78, process: 66, laboratory: 22, safety: 23 }, "class2-wastewater": { equipment: 38, process: 62, laboratory: 24, safety: 21 } };
    for (const [bankKey, bank] of Object.entries(rawManifest.banks)) {
      const counts = Object.fromEntries(Object.keys(areas).map(area => [area, Object.values(bank.entries).filter(entry => entry.area === area).length]));
      expect(counts).toEqual(expected[bankKey as keyof typeof expected]);
      expect(Object.keys(bank.entries).length + bank.excludedQuestionNums.length).toBe(bankKey === "class1-wastewater" ? 815 : 547);
      for (const entry of Object.values(bank.entries)) expect(Object.keys(entry).sort()).toEqual(["area", "sha256"]);
    }
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(routerSource.match(/resolveWastewaterMockArea\(spec\.bankKey, question\)/g)).toHaveLength(1);
  });
});
