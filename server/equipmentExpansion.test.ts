import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EQUIPMENT_REGISTRY, findEquipment, equipmentRoutes } from "../shared/equipmentRegistry";
import { equipmentCatalogue, filterEquipmentCatalogue } from "../shared/equipmentCatalogue";
import { STATIC_PAGE_META } from "./pageSsr";

const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const newIds = ["centrifugal-pump", "rapid-gravity-filter", "chlorine-contact-tank", "uv-reactor", "bar-screen", "grit-chamber", "lift-station", "pressure-reducing-valve"];
const result = (id: string) => findEquipment(id)!.formulas[0].worked.result;
const number = (text: string) => Number(text.match(/-?\d+(?:\.\d+)?/)![0]);

describe("Equipment library expansion", () => {
  it("retains both old units and adds eight units with unique module numbers", () => {
    expect(EQUIPMENT_REGISTRY).toHaveLength(9);
    const items = equipmentCatalogue();
    expect(items).toHaveLength(10);
    expect(items[0].id).toBe("circular-clarifier");
    expect(findEquipment("aeration-basin")).toBeDefined();
    for (const id of newIds) expect(findEquipment(id)).toBeDefined();
    expect(new Set(items.map(item => item.moduleNumber)).size).toBe(10);
    expect(new Set(items.map(item => item.id)).size).toBe(10);
  });
  it("searches title, summary and related topics and combines search with category", () => {
    const items = equipmentCatalogue();
    expect(filterEquipmentCatalogue(items, "  PiLoT ").map(item => item.id)).toEqual(["pressure-reducing-valve"]);
    expect(filterEquipmentCatalogue(items, "settling").some(item => item.id === "circular-clarifier")).toBe(true);
    expect(filterEquipmentCatalogue(items, "", "water-treatment")).toHaveLength(3);
    expect(filterEquipmentCatalogue(items, "", "wastewater-treatment")).toHaveLength(4);
    expect(filterEquipmentCatalogue(items, "", "water-distribution")).toHaveLength(2);
    expect(filterEquipmentCatalogue(items, "", "wastewater-collection")).toHaveLength(1);
    expect(filterEquipmentCatalogue(items, "pilot", "water-treatment")).toEqual([]);
    expect(filterEquipmentCatalogue(items, "no equipment matches xyz")).toEqual([]);
    expect(filterEquipmentCatalogue(items, " \t ")).toHaveLength(10);
  });
  it("has real guide/practice routes and nonempty unique component IDs", () => {
    for (const unit of EQUIPMENT_REGISTRY) {
      for (const route of [unit.guideRoute, unit.practiceRoute]) expect(app, route).toContain(`path={"${route}"}`);
      expect(unit.parts.length).toBeGreaterThan(3);
      expect(new Set(unit.parts.map(part => part.id)).size).toBe(unit.parts.length);
      for (const part of unit.parts) for (const key of ["label", "function", "operatorLens", "examConnection"] as const) expect(part[key].length).toBeGreaterThan(5);
      expect(unit.stages.length).toBeGreaterThan(2);
    }
    expect(app).toContain("<EquipmentDetail key={unit.id} equipment={unit} />");
  });
  it("makes every addition indexable with reviewed technical sources and metric-only wording", () => {
    expect(equipmentRoutes()).toHaveLength(9);
    for (const id of newIds) {
      const unit = findEquipment(id)!;
      expect(unit.sources!.length).toBeGreaterThanOrEqual(2);
      for (const source of unit.sources!) {
        expect(new URL(source.url).protocol).toBe("https:");
        expect(source.reviewedAt).toBe("2026-11-26");
        expect(source.supports.length).toBeGreaterThan(10);
      }
      const page = STATIC_PAGE_META.find(meta => meta.path === `/equipment-lab/${unit.slug}`)!;
      expect(page.bodyHtml).toContain("Technical reading");
      expect(page.bodyHtml).toContain("Worked examples on this module use metric units");
      expect(page.bodyHtml).not.toContain("US unit versions available");
    }
  });
  it("keeps disinfection and pressure-regulation limitations explicit", () => {
    expect(JSON.stringify(findEquipment("chlorine-contact-tank"))).toMatch(/neither compliance|no compliance|no.*compliance/);
    expect(JSON.stringify(findEquipment("uv-reactor"))).toMatch(/validat/i);
    expect(JSON.stringify(findEquipment("pressure-reducing-valve"))).toMatch(/not backflow protection|not.*nonreturn|not.*backflow/i);
  });
});

describe("New equipment worked arithmetic", () => {
  it("computes pump pressure head", () => expect(number(result("centrifugal-pump"))).toBeCloseTo((325 - 80) * 1000 / (1000 * 9.81), 0));
  it("computes filter loading", () => expect(number(result("rapid-gravity-filter"))).toBeCloseTo((2400 / 24) / (5 * 4), 2));
  it("computes nominal time, T10 and residual CT separately", () => {
    const text = result("chlorine-contact-tank");
    expect(text).toContain("30 min");
    expect(text).toContain("18 min");
    expect(Number(text.match(/calculated CT: ([\d.]+)/)![1])).toBeCloseTo(0.8 * 0.6 * (600 / 20), 2);
  });
  it("computes UV inlet velocity, not disinfection dose", () => expect(number(result("uv-reactor"))).toBeCloseTo((180 / 3600) / (Math.PI * 0.2 ** 2 / 4), 2));
  it("computes screen approach velocity", () => expect(number(result("bar-screen"))).toBeCloseTo((25920 / 86400) / (1.2 * 0.5), 2));
  it("computes grit channel velocity", () => expect(number(result("grit-chamber"))).toBeCloseTo(0.2 / 0.8, 2));
  it("includes continuing inflow in lift station drawdown", () => expect(number(result("lift-station"))).toBeCloseTo(6 * 0.6 / 3 + 0.4, 2));
  it("computes valve pressure drop", () => expect(number(result("pressure-reducing-valve"))).toBe(650 - 420));
});
