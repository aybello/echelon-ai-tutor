import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const careerMap = readFileSync(new URL("./CareerMap.tsx", import.meta.url), "utf8");
const careerData = readFileSync(new URL("../lib/careerDataProvinces.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("Career Map release contracts", () => {
  it("uses registered Ontario wastewater routes and Western WPI wastewater routes", () => {
    expect(careerMap).toContain('province.id === "on" ? `${base}-ww` : `${base}-wastewater`');
    expect(app).toContain('path={"/class1-ww"}');
    expect(app).toContain('path={"/class4-ww"}');
    expect(app).toContain('path={"/wpi-class1-wastewater"}');
    expect(app).toContain('path={"/wpi-class4-wastewater"}');
  });

  it("keeps course prices aligned with the shared catalogue values", () => {
    const westernData = careerData.slice(careerData.indexOf("// BRITISH COLUMBIA"));
    expect(westernData).not.toContain("WPI Class I ($99) on Echelon");
    expect(westernData).not.toContain("WPI Class II ($149) on Echelon");
    expect(westernData).not.toContain("OIT — $49 on Echelon");
    expect(westernData).toContain("WPI Class I ($149) on Echelon");
    expect(westernData).toContain("WPI Class II ($199) on Echelon");
  });

  it("persists province and clears cross-province selection and track state", () => {
    expect(careerMap).toContain('localStorage.setItem("echelon_province", provinceId)');
    expect(careerMap).toContain("url.searchParams.set(\"province\", provinceId)");
    expect(careerMap).toContain("setSelected(null);");
    expect(careerMap).toContain('setTrack("all");');
  });

  it("filters the ladder instead of fading incompatible levels", () => {
    expect(careerMap).toContain("const visibleLevels = mainLevels.filter");
    expect(careerMap).toContain("const selectedVisible = selected &&");
    expect(careerMap).toContain("DetailPanel level={selectedVisible}");
    expect(careerMap).toContain("visibleLevels.map");
    expect(careerMap).toContain("track === \"all\" || l.tracks.includes(track)");
    expect(careerMap).toContain("selected={selectedVisible} province={province} track={track}");
    expect(careerMap).toContain("mainLevels.length > 1");
    expect(careerMap).toContain("province.salaryJumps.slice(0, mainLevels.length - 1)");
    expect(careerMap).toContain('aria-label="Select Water Quality Analyst (WQA) specialist path"');
    expect(careerMap).toContain('className="career-salary-scale"');
    expect(careerMap).toContain("TRACKS.filter(t => t.id !== \"wqa\" || specialistLevel)");
    expect(careerMap).toContain('t.id === "wqa" ? "WQA"');
  });

  it("keeps interactive controls keyboard-semantic and labels timeline nodes", () => {
    expect(careerMap).toContain('aria-label={`${l.label}, ${l.years}`}');
    expect(careerMap).toContain('aria-pressed={selected?.id === l.id}');
    expect(careerMap).toContain('aria-pressed={selected === p.id}');
    expect(careerMap).toContain('aria-pressed={view === v}');
    expect(careerMap).toContain('aria-pressed={track === id}');
    expect(careerMap).toContain("prefers-reduced-motion");
  });

  it("keeps employer surfaces organization-only", () => {
    expect(careerMap).toContain('href="/teams"');
    expect(careerMap).toContain('href="/partnerships"');
    expect(careerMap).toContain("Individual course pricing is not shown here.");
    expect(careerMap).not.toContain('href="/pricing"');
  });
});
