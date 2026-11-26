import { describe, expect, it } from "vitest";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createPumpVoluteGeometry, PUMP_DISCHARGE } from "./equipmentPumpGeometry";

function dischargeHits(x: number, z: number): number {
  const geometry = createPumpVoluteGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(geometry, material);
  mesh.updateMatrixWorld(true);
  const hits = new Raycaster(new Vector3(x, 0.45, z), new Vector3(0, 1, 0), 0, 0.9).intersectObject(mesh).length;
  geometry.dispose(); material.dispose();
  return hits;
}

describe("Pump volute discharge penetration", () => {
  it("connects the volute chamber to the nozzle through a real circular opening", () => {
    expect(dischargeHits(PUMP_DISCHARGE.x, PUMP_DISCHARGE.z)).toBe(0);
    expect(dischargeHits(PUMP_DISCHARGE.x + 0.1, PUMP_DISCHARGE.z)).toBe(0);
  });
  it("retains the spiral wall adjacent to the nozzle port", () => {
    expect(dischargeHits(PUMP_DISCHARGE.x, PUMP_DISCHARGE.z + 0.23)).toBeGreaterThan(0);
    expect(dischargeHits(PUMP_DISCHARGE.x - 0.23, PUMP_DISCHARGE.z)).toBeGreaterThan(0);
  });
  it("crosses both thickness faces throughout the negative-Z seam gap", () => {
    const geometry = createPumpVoluteGeometry();
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const mesh = new Mesh(geometry, material);
    mesh.updateMatrixWorld(true);
    const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 0.3);
    try {
      for (const x of [-0.999, -0.8, -0.65, -0.401]) {
        for (const z of [-0.945, -0.985, -1.025]) {
          ray.ray.origin.set(x, 0, z);
          const hits = ray.intersectObject(mesh);
          // Distinct depths, not two triangles hit on one face's diagonal.
          for (const depth of [0.06, 0.14]) {
            expect(hits.some(hit => Math.abs(hit.distance - depth) < 1e-5)).toBe(true);
          }
        }
      }
    } finally {
      geometry.dispose(); material.dispose();
    }
  });
  it("keeps all spiral, seam and bore coordinates finite", () => {
    const geometry = createPumpVoluteGeometry();
    expect(Array.from(geometry.getAttribute("position").array).every(Number.isFinite)).toBe(true);
    geometry.dispose();
  });
});
