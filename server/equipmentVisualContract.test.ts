import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EQUIPMENT_REGISTRY } from "../shared/equipmentRegistry";
import { EQUIPMENT_DIAGRAM_MODELS } from "../client/src/lib/equipmentDiagramModels";

const scene = readFileSync(new URL("../client/src/components/EquipmentUnitScene.tsx", import.meta.url), "utf8");
const stage = readFileSync(new URL("../client/src/components/EquipmentThreeStage.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("../client/src/pages/EquipmentDetail.tsx", import.meta.url), "utf8");
const hub = readFileSync(new URL("../client/src/pages/EquipmentLab.tsx", import.meta.url), "utf8");
const diagram = readFileSync(new URL("../client/src/components/EquipmentDiagram.tsx", import.meta.url), "utf8");

describe("Equipment visual contracts", () => {
  it("covers every registry unit with exactly matching diagram components", () => {
    for (const unit of EQUIPMENT_REGISTRY) {
      const model = EQUIPMENT_DIAGRAM_MODELS[unit.slug];
      expect(model, unit.slug).toBeDefined();
      expect(model.parts.map(part => part.id).sort()).toEqual(unit.parts.map(part => part.id).sort());
      expect(model.flows.length).toBeGreaterThan(0);
    }
  });
  it("dispatches all eight new units and maps their part IDs into 3D", () => {
    for (const unit of EQUIPMENT_REGISTRY.filter(item => item.slug !== "aeration-basin")) {
      expect(scene).toContain(`case "${unit.slug}"`);
      for (const part of unit.parts) expect(scene, `${unit.slug}/${part.id}`).toContain(`"${part.id}"`);
    }
    expect(stage).toContain("<EquipmentUnitScene equipment={equipment}");
    expect(stage).toContain("<EquipmentAerationScene");
  });
  it("keeps parent inspector selection shared with the fallback schematic", () => {
    expect(detail).toContain("<EquipmentDiagram equipment={equipment} activePart={activePart} onSelectPart={setActivePart}");
    expect(diagram).toContain("onSelectPart(id)");
    expect(diagram).toContain("registeredParts.has(id)");
    expect(diagram).toContain("useId()");
  });
  it("preserves clarifier recording, anchor and both renderers", () => {
    expect(hub).toContain('id="clarifier"');
    expect(hub).toContain('topic="Equipment Lab - circular clarifier"');
    expect(hub).toContain("<ClarifierThreeLab");
    expect(hub).toContain("<ClarifierLab");
  });
  it("keeps rotation and travel subscriptions gated by motion and exploded mode", () => {
    expect(stage).toContain("shouldAnimate(flowing, reduced, exploded)");
    expect(scene.match(/(\w+)\.animate && \1\.view !== "exploded"/g)).toHaveLength(2);
    expect(scene).not.toContain("new THREE.BoxGeometry");
    expect(scene).not.toContain("<Canvas");
    expect(scene).toMatch(/\w+\.stopPropagation\(\)/);
    expect(scene).toContain("raycast: NO_RAYCAST");
  });
  it("uses each formula card's actual available unit system for term labels", () => {
    expect(detail).toContain("showUs && t.unitsUs ? t.unitsUs : t.units");
  });
  it("keeps small informative labels readable regardless of equipment accent", () => {
    const catalogue = readFileSync(new URL("../client/src/components/EquipmentCatalogue.tsx", import.meta.url), "utf8");
    expect(catalogue).toContain('"ml-1 text-slate-600"');
    expect(catalogue).not.toContain("text-slate-400");
    expect(detail).toContain("border-2 bg-slate-900 text-[11px] font-bold text-white");
    expect(detail).toContain("borderColor: stage.accent");
    expect(detail).not.toContain("background: stage.accent");
    expect(detail).not.toContain("text-slate-400");
  });
});
