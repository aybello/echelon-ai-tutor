import { createElement, useId, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EQUIPMENT_REGISTRY, type EquipmentDefinition } from "@shared/equipmentRegistry";
import { EQUIPMENT_DIAGRAM_MODELS, wrapEquipmentLabel } from "@/lib/equipmentDiagramModels";
import EquipmentDiagram from "./EquipmentDiagram";

vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useId: vi.fn(actual.useId) };
});

const expectedParts: Record<string, string[]> = {
  "aeration-basin": ["influent-channel", "diffuser-grid", "blower", "do-probe", "mixed-liquor", "ras-line", "was-line"],
  "centrifugal-pump": ["suction", "impeller", "casing", "shaft", "motor", "discharge"],
  "rapid-gravity-filter": ["inlet", "supernatant", "media", "underdrain", "wash-trough", "outlet"],
  "chlorine-contact-tank": ["inlet", "baffles", "contact-zone", "outlet", "sample-point"],
  "uv-reactor": ["inlet", "reactor", "lamps", "sleeves", "sensor", "outlet"],
  "bar-screen": ["upstream", "bars", "rake", "screenings", "downstream"],
  "grit-chamber": ["inlet", "chamber", "grit-hopper", "classifier", "outlet"],
  "lift-station": ["inlet", "wet-well", "pump", "riser", "check-valve", "level-sensor"],
  "pressure-reducing-valve": ["inlet", "strainer", "diaphragm", "spring", "pilot", "outlet"],
};
function fixture(slug: string): EquipmentDefinition {
  const actual = EQUIPMENT_REGISTRY.find(unit => unit.slug === slug);
  if (actual) return actual;
  return { ...EQUIPMENT_REGISTRY[0], slug, shortTitle: slug, parts: expectedParts[slug].map(id => ({
    ...EQUIPMENT_REGISTRY[0].parts[0], id, label: id.split("-").join(" "),
  })) };
}
const model = (slug: string) => EQUIPMENT_DIAGRAM_MODELS[slug];
const getPart = (slug: string, id: string) => model(slug).parts.find(p => p.id === id)!;

describe("EquipmentDiagram deterministic descriptors", () => {
  it("covers exactly all nine units and every exact registry part ID", () => {
    expect(Object.keys(EQUIPMENT_DIAGRAM_MODELS).sort()).toEqual(Object.keys(expectedParts).sort());
    for (const [slug, ids] of Object.entries(expectedParts)) {
      expect(model(slug).parts.map(p => p.id).sort()).toEqual([...ids].sort());
      const actual = EQUIPMENT_REGISTRY.find(unit => unit.slug === slug);
      if (actual) expect(model(slug).parts.map(p => p.id).sort()).toEqual(actual.parts.map(p => p.id).sort());
      for (const p of model(slug).parts) {
        expect(p.shapes.length).toBeGreaterThan(0);
        expect(p.shapes.every(s => s.d.startsWith("M") && !/NaN|undefined/.test(s.d))).toBe(true);
        expect(p.anchor[0]).toBeGreaterThanOrEqual(130);
        expect(p.anchor[0]).toBeLessThanOrEqual(590);
        expect(p.anchor[1]).toBeGreaterThanOrEqual(90);
        expect(p.anchor[1]).toBeLessThanOrEqual(300);
      }
    }
  });

  it("keeps all registry label lines inside the viewBox without overlapping", () => {
    for (const slug of Object.keys(expectedParts)) {
      const labels = model(slug).parts.map(p => {
        const text = fixture(slug).parts.find(item => item.id === p.id)!.label;
        const lateral = p.side === "left" || p.side === "right";
        const lines = wrapEquipmentLabel(text, lateral ? 13 : 18);
        const width = Math.max(...lines.map(line => line.length)) * 9;
        const x = p.labelAt[0] - (p.side === "left" ? width : p.side === "right" ? 0 : width / 2);
        return { x, y: p.labelAt[1] - 16, width, height: lines.length * 18 };
      });
      for (const [i, a] of labels.entries()) {
        expect(a.x).toBeGreaterThanOrEqual(0);
        expect(a.x + a.width).toBeLessThanOrEqual(720);
        expect(a.y).toBeGreaterThanOrEqual(0);
        expect(a.y + a.height).toBeLessThanOrEqual(410);
        for (const b of labels.slice(i + 1)) {
          expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y).toBe(false);
        }
      }
    }
  });

  it("separates blower air from RAS return and the system's waste-sludge branch", () => {
    const flows = model("aeration-basin").flows;
    expect(flows.filter(f => f.medium === "air").map(f => [f.from, f.to])).toEqual([["blower", "diffuser-grid"]]);
    expect(flows.some(f => f.from === "secondary-clarifier" && f.to === "ras-line" && f.medium === "sludge")).toBe(true);
    expect(flows.some(f => f.from === "ras-line" && f.to === "solids-handling" && f.medium === "sludge")).toBe(true);
    expect(flows.some(f => f.from === "ras-line" && f.to === "mixed-liquor")).toBe(true);
  });

  it("shows axial suction and upward radial discharge separately from the drive shaft", () => {
    expect(getPart("centrifugal-pump", "suction").anchor[0]).toBeLessThan(getPart("centrifugal-pump", "impeller").anchor[0]);
    expect(getPart("centrifugal-pump", "discharge").anchor[1]).toBeLessThan(getPart("centrifugal-pump", "impeller").anchor[1]);
    expect(model("centrifugal-pump").flows.some(f => f.from === "casing" && f.to === "discharge")).toBe(true);
    expect(model("centrifugal-pump").flows.some(f => [f.from, f.to].includes("shaft"))).toBe(false);
  });

  it("orders the filter vertically and shows service flow, not simultaneous backwash", () => {
    const ys = ["wash-trough", "media", "underdrain"].map(id => getPart("rapid-gravity-filter", id).anchor[1]);
    expect(ys[0]).toBeLessThan(ys[1]);
    expect(ys[1]).toBeLessThan(ys[2]);
    expect(model("rapid-gravity-filter").flows.map(f => [f.from, f.to])).toEqual([
      ["inlet", "supernatant"], ["supernatant", "media"], ["media", "underdrain"], ["underdrain", "outlet"],
    ]);
  });

  it("places the waste-sludge hotspot on its distinct branch, not the RAS pipe", () => {
    const waste = getPart("aeration-basin", "was-line");
    expect(waste.anchor[0]).toBeGreaterThan(455);
    expect(waste.anchor[0]).toBeLessThan(568);
    expect(waste.anchor[1]).toBe(274);
    expect(waste.shapes[0].d).toContain("V274H568");
    expect(Math.abs(waste.anchor[1] - 296)).toBeGreaterThan(18);
  });

  it("places the lift-station riser hotspot on exposed pipe outside both check valves", () => {
    const riser = getPart("lift-station", "riser");
    expect(riser.anchor[0]).toBe(414);
    expect(riser.anchor[1]).toBeGreaterThan(165 + 12);
    expect(riser.anchor[1]).toBeLessThan(250);
    expect(riser.shapes.some(shape => shape.d === "M382 250H414V133")).toBe(true);
    for (const [x, y, w, h] of [[311, 143, 24, 22], [402, 143, 24, 22]]) {
      expect(riser.anchor[0] >= x && riser.anchor[0] <= x + w && riser.anchor[1] >= y && riser.anchor[1] <= y + h).toBe(false);
    }
  });

  it("routes PRV main flow inside the wetted passage through the disc-seat gap", () => {
    const prv = model("pressure-reducing-valve");
    const passage = getPart("pressure-reducing-valve", "diaphragm").shapes.find(shape => shape.fill === "water")!;
    const vertices = (d: string): [number, number][] => {
      const result: [number, number][] = [];
      let x = 0, y = 0;
      for (const match of d.matchAll(/([MHV])([\d.]+)(?:[ ,]+([\d.]+))?/g)) {
        if (match[1] === "M") { x = Number(match[2]); y = Number(match[3]); }
        if (match[1] === "H") x = Number(match[2]);
        if (match[1] === "V") y = Number(match[2]);
        result.push([x, y]);
      }
      return result;
    };
    const polygon = vertices(passage.d);
    const inside = (x: number, y: number) => {
      let contained = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) contained = !contained;
      }
      return contained;
    };
    const route = vertices(prv.flows.find(flow => flow.d.startsWith("M301"))!.d);
    for (let i = 1; i < route.length; i++) {
      const [a, b] = [route[i - 1], route[i]];
      for (let t = 0; t <= 1; t += 0.1) expect(inside(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)).toBe(true);
    }
    expect(route.some(([x, y], i) => i > 0 && route[i - 1][0] < 329 && x > 365 && y > 239 && y < 246)).toBe(true);
  });

  it("places contact sampling after the final pass and UV lamps inside longer sleeves", () => {
    expect(getPart("chlorine-contact-tank", "sample-point").anchor[0]).toBeGreaterThan(getPart("chlorine-contact-tank", "outlet").anchor[0]);
    expect(model("chlorine-contact-tank").flows[1].d).toContain("477 248V158");
    expect(getPart("uv-reactor", "sleeves").shapes).toHaveLength(2);
    expect(getPart("uv-reactor", "lamps").shapes[0].d).toContain("267 177H450");
    expect(getPart("uv-reactor", "sensor").anchor[1]).toBeLessThan(getPart("uv-reactor", "inlet").anchor[1]);
  });

  it("separates screening, grit extraction, and two check-valved pumping branches", () => {
    expect(getPart("bar-screen", "screenings").anchor[1]).toBeLessThan(getPart("bar-screen", "upstream").anchor[1]);
    expect(model("grit-chamber").flows.some(f => f.from === "grit-hopper" && f.to === "classifier" && f.medium === "grit")).toBe(true);
    expect(model("grit-chamber").description).toContain("not biologically treated");
    expect(model("lift-station").flows.filter(f => f.from === "pump" && f.to === "check-valve")).toHaveLength(2);
  });

  it("puts a small PRV strainer on upstream pilot feed and spring in the external pilot", () => {
    const prv = model("pressure-reducing-valve");
    expect(prv.flows.filter(f => f.to === "strainer").every(f => f.from === "inlet" && f.medium === "pilot")).toBe(true);
    expect(prv.flows.some(f => f.from === "strainer" && f.to === "pilot" && f.medium === "pilot")).toBe(true);
    expect(prv.flows.some(f => f.to === "strainer" && f.medium === "water")).toBe(false);
    expect(getPart("pressure-reducing-valve", "spring").anchor[0]).toBe(getPart("pressure-reducing-valve", "pilot").anchor[0] + 2);
    expect(getPart("pressure-reducing-valve", "pilot").shapes[0].d).toContain("H529V238");
  });
});

describe("EquipmentDiagram rendering contract", () => {
  it("renders role=img, exact part labels, unique numbered markers, and one limitations note", () => {
    const equipment = fixture("aeration-basin");
    const html = renderToStaticMarkup(createElement(EquipmentDiagram, { equipment, activePart: "do-probe" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("<title");
    expect(html).toContain("<desc");
    expect(html).toContain('data-part-id="do-probe" data-selected="true"');
    expect(html.match(/Conceptual section, not to scale/g)).toHaveLength(1);
    expect(html).not.toMatch(/tabindex|tabIndex|role="button"/);
    expect(html).toContain("Dissolved Oxygen");
    expect(html).toContain('min-width:640px');
    const markers = [...html.matchAll(/<marker[^>]+id="([^"]+)"/g)].map(m => m[1]);
    expect(new Set(markers).size).toBe(5);
  });

  it("makes compact previews decorative and excludes labels, hotspots and selection", () => {
    const equipment = fixture("aeration-basin");
    const html = renderToStaticMarkup(createElement(EquipmentDiagram, { equipment, compact: true, activePart: "do-probe", onSelectPart: () => {} }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('role="presentation"');
    expect(html).toContain("pointer-events:none");
    expect(html).not.toMatch(/<text|<title|<desc|tabindex|data-part-id|data-selected|aria-labelledby|Conceptual section/);
  });

  it("uses useId so multiple full and compact diagrams do not share any IDs", () => {
    const equipment = fixture("centrifugal-pump");
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(EquipmentDiagram, { equipment }), createElement(EquipmentDiagram, { equipment, compact: true }),
      createElement(EquipmentDiagram, { equipment })));
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    expect(ids.length).toBe(19);
    expect(new Set(ids).size).toBe(ids.length);
    for (const marker of [...html.matchAll(/marker-end="url\(#([^)]+)\)"/g)]) expect(ids).toContain(marker[1]);
  });

  it("attaches exact inspector callbacks only to full geometry and labels", () => {
    const equipment = fixture("aeration-basin");
    const selected: string[] = [];
    const visit = (node: ReactNode, action: (element: ReactElement<Record<string, unknown>>) => void): void => {
      if (Array.isArray(node)) return node.forEach(child => visit(child, action));
      if (!node || typeof node !== "object" || !("props" in node)) return;
      const element = node as ReactElement<Record<string, unknown>>;
      action(element);
      visit(element.props.children as ReactNode, action);
    };
    const props = { equipment, onSelectPart: (id: string) => selected.push(id) };
    vi.mocked(useId).mockReturnValueOnce("diagram-test");
    const tree = EquipmentDiagram(props);
    expect(selected).toEqual([]);
    visit(tree, element => {
      if (element.props["data-part-id"] && typeof element.props.onClick === "function") element.props.onClick();
    });
    expect(selected.sort()).toEqual([...expectedParts["aeration-basin"]].sort());
    selected.length = 0;
    vi.mocked(useId).mockReturnValueOnce("compact-test");
    visit(EquipmentDiagram({ ...props, compact: true }), element => {
      if (typeof element.props.onClick === "function") element.props.onClick();
    });
    expect(selected).toEqual([]);
  });
});
