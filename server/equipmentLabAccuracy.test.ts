import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EQUIPMENT_REGISTRY } from "../shared/equipmentRegistry";

/**
 * The first round of Equipment Lab tests locked wording and indexability.
 * An independent review pointed out that they never checked whether the
 * numbers in a worked example are actually right, and never looked outside
 * the registry file.
 *
 * A worked example with wrong arithmetic is worse than no worked example.
 * A learner trusts it, repeats it on the exam, and fails. These tests recompute
 * every number we publish, and extend the prose rules to the page components
 * that render them.
 */

const CLIENT = join(__dirname, "..", "client", "src");

function readSource(relative: string): string {
  return readFileSync(join(CLIENT, relative), "utf8");
}

/** Pulls the final number out of a result string such as "F/M = 0.20 kg ...". */
function firstNumber(text: string): number {
  const match = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  expect(match, `no number found in "${text}"`).toBeTruthy();
  return Number(match![0]);
}

describe("Equipment Lab worked examples are arithmetically correct", () => {
  const aeration = EQUIPMENT_REGISTRY.find(u => u.slug === "aeration-basin");

  it("has the aeration basin registered", () => {
    expect(aeration).toBeTruthy();
  });

  it("computes the metric food-to-microorganism ratio correctly", () => {
    const formula = aeration!.formulas.find(f => f.id === "fm-ratio");
    expect(formula).toBeTruthy();

    // 8,000 m3/day at 150 mg/L BOD; 3,000 m3 basin at 2,000 mg/L MLVSS.
    const food = (8000 * 150) / 1000; // kg/day
    const microorganisms = (3000 * 2000) / 1000; // kg
    expect(food).toBe(1200);
    expect(microorganisms).toBe(6000);
    expect(food / microorganisms).toBeCloseTo(0.2, 4);
    expect(firstNumber(formula!.worked.result)).toBeCloseTo(0.2, 4);
  });

  it("computes the US food-to-microorganism ratio correctly", () => {
    const formula = aeration!.formulas.find(f => f.id === "fm-ratio");
    const food = 2.0 * 150 * 8.34; // lb/day
    const microorganisms = 0.75 * 2000 * 8.34; // lb
    expect(food / microorganisms).toBeCloseTo(0.2, 4);
    expect(firstNumber(formula!.workedUs!.result)).toBeCloseTo(0.2, 4);
  });

  it("computes metric sludge age correctly", () => {
    const formula = aeration!.formulas.find(f => f.id === "sludge-age");
    const held = (3000 * 2500) / 1000; // kg
    expect(held).toBe(7500);
    expect(held / (700 + 50)).toBeCloseTo(10, 4);
    expect(firstNumber(formula!.worked.result)).toBeCloseTo(10, 2);
  });

  it("computes US sludge age correctly", () => {
    const formula = aeration!.formulas.find(f => f.id === "sludge-age");
    expect(
      formula!.workedUs,
      "sludge age is heavily tested in US units and needs a US example"
    ).toBeTruthy();
    const held = 0.75 * 2500 * 8.34; // lb
    expect(held / (1545 + 110)).toBeCloseTo(9.4, 1);
    expect(firstNumber(formula!.workedUs!.result)).toBeCloseTo(9.4, 1);
  });

  it("computes hydraulic detention time correctly in both systems", () => {
    const formula = aeration!.formulas.find(f => f.id === "detention-time");
    expect((24 * 3000) / 8000).toBeCloseTo(9, 4);
    expect(firstNumber(formula!.worked.result)).toBeCloseTo(9, 2);
    expect(750000 / (2000000 / 24)).toBeCloseTo(9, 2);
    expect(firstNumber(formula!.workedUs!.result)).toBeCloseTo(9, 2);
  });

  it("computes the sludge volume index correctly", () => {
    const formula = aeration!.formulas.find(f => f.id === "svi");
    expect((250 * 1000) / 2500).toBe(100);
    expect(firstNumber(formula!.worked.result)).toBeCloseTo(100, 2);
  });
});

describe("Equipment Lab unit toggles stay internally consistent", () => {
  it("labels US units for every term whose unit differs between systems", () => {
    const metricOnly = /m3|kg|mg\/L/i;
    for (const unit of EQUIPMENT_REGISTRY) {
      for (const formula of unit.formulas) {
        // Only formulas that actually offer a US example can be toggled.
        if (!formula.workedUs) continue;
        for (const term of formula.terms) {
          if (!metricOnly.test(term.units)) continue;
          // mg/L is written the same way on both sides of the border.
          if (term.units.trim() === "mg/L") continue;
          expect(
            term.unitsUs,
            `${unit.slug} / ${formula.id} / ${term.symbol} has metric units ` +
              `"${term.units}" but no US label, so the US toggle would show a ` +
              `US formula over metric definitions`
          ).toBeTruthy();
        }
      }
    }
  });

  it("defines every symbol that appears in a US expression", () => {
    for (const unit of EQUIPMENT_REGISTRY) {
      for (const formula of unit.formulas) {
        if (!formula.expressionUs) continue;
        if (!formula.expressionUs.includes("8.34")) continue;
        const defined = formula.terms.some(t => t.symbol.includes("8.34"));
        expect(
          defined,
          `${unit.slug} / ${formula.id} uses the 8.34 conversion factor in its ` +
            `US expression without defining it`
        ).toBe(true);
      }
    }
  });

  it("does not claim a US example is an exact conversion of the metric one", () => {
    // 8,000 m3/day is 2.11 MGD, not 2.0. The US figures are chosen for clean
    // arithmetic, so calling them "the same basin" invites a learner to check
    // the conversion and conclude the page is wrong.
    for (const unit of EQUIPMENT_REGISTRY) {
      for (const formula of unit.formulas) {
        if (!formula.workedUs) continue;
        expect(
          formula.workedUs.scenario.toLowerCase(),
          `${unit.slug} / ${formula.id} claims the US example is the same basin`
        ).not.toContain("the same basin");
      }
    }
  });
});

describe("Equipment Lab learner-facing components follow the prose rules", () => {
  // The registry test only scanned the registry. The em dash that reached the
  // study log lived in the page component, outside its reach.
  const files = [
    "pages/EquipmentDetail.tsx",
    "pages/EquipmentLab.tsx",
    "components/EquipmentThreeStage.tsx",
    "components/EquipmentAerationScene.tsx",
  ];

  for (const file of files) {
    it(`uses no em dashes in ${file}`, () => {
      const source = readSource(file);
      const lines = source.split("\n");
      const offenders = lines
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => line.includes("\u2014"));
      expect(
        offenders.map(o => `${file}:${o.n}`),
        "em dashes are not allowed in learner-facing prose"
      ).toEqual([]);
    });
  }

  it("keeps a single source of truth for WebGL detection", () => {
    // Three.js here needs WebGL 2. A second, looser WebGL 1 probe would let the
    // canvas mount on a device that then renders nothing.
    const stage = readSource("components/EquipmentThreeStage.tsx");
    expect(stage).toContain("supportsWebGL2");
    expect(
      stage,
      "the stage must not run its own looser WebGL 1 probe"
    ).not.toContain('getContext("experimental-webgl")');
  });

  it("repositions the camera when the view changes, not only on mount", () => {
    // The camera prop on <Canvas> applies once. Without an explicit rig, the
    // Top, Cutaway and Exploded buttons stop working after the user orbits.
    const stage = readSource("components/EquipmentThreeStage.tsx");
    expect(stage).toContain("camera.position.set");
    expect(stage).toMatch(/useEffect\([\s\S]*camera\.position\.set/);
  });

  it("does not allocate Three.js geometry inside the render path", () => {
    // Allocating per render leaked an undisposed geometry on every click.
    const scene = readSource("components/EquipmentAerationScene.tsx");
    const renderStart = scene.indexOf("return (");
    expect(renderStart).toBeGreaterThan(-1);
    expect(
      scene.slice(renderStart),
      "hoist constant geometry to module scope or memoize it"
    ).not.toContain("new THREE.BoxGeometry(");
  });

  it("highlights a selected pipe instead of silently doing nothing", () => {
    const scene = readSource("components/EquipmentAerationScene.tsx");
    expect(scene).not.toContain("active ? null : null");
    // Every Pipe the learner can select must receive the active flag so its
    // geometry changes colour. The flag may be written inline or through the
    // isOn() helper, so accept either spelling of the same behaviour.
    for (const id of ["ras-line", "was-line", "blower"]) {
      const inline = scene.includes(`active={activePart === "${id}"}`);
      const viaHelper = scene.includes(`active={isOn("${id}")}`);
      expect(
        inline || viaHelper,
        `clicking ${id} must change something in the 3D scene`
      ).toBe(true);
    }
    // The helper must resolve against the selected part, otherwise the check
    // above could pass against a constant that never changes.
    expect(scene).toContain("const isOn = (id: string) => activePart === id;");
  });

  it("lets a learner click equipment submerged in the mixed liquor", () => {
    // The mixed liquor box encloses the basin, so without this it swallows
    // every raycast aimed at the diffusers, probe and pipes inside it.
    const scene = readSource("components/EquipmentAerationScene.tsx");
    expect(scene).toContain("raycast={() => null}");
  });

  it("models the basin as a structure, not floating planes", () => {
    // The first version drew four transparent planes in empty space. An
    // operator recognises a basin by its poured walls, slab, deck and rails,
    // so those have to be present for the model to read as real equipment.
    const scene = readSource("components/EquipmentAerationScene.tsx");
    for (const marker of ["WALL_T", "GRADE_Y", "Handrail", "notches"]) {
      expect(
        scene,
        `the basin needs real structure: "${marker}" is missing`
      ).toContain(marker);
    }
    // Walls have thickness. A plane has none.
    expect(scene).toMatch(/WALL_T\s*=\s*0\.\d+/);
  });
});
