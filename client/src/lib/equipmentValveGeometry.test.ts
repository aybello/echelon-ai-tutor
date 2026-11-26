import { describe, expect, it } from "vitest";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createPRVBodyGeometry, PRV_BODY } from "./equipmentValveGeometry";

function hitsPort(side: -1 | 1, y: number, z: number): boolean {
  const geometry = createPRVBodyGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(geometry, material);
  mesh.updateMatrixWorld();
  const hit = new Raycaster(new Vector3(side * 1.1, y, z), new Vector3(-side, 0, 0), 0, 0.5)
    .intersectObject(mesh).length > 0;
  geometry.dispose(); material.dispose();
  return hit;
}

describe("Assembled PRV cylindrical cross-bores", () => {
  it("opens each actual nozzle centerline without removing the adjacent body wall", () => {
    for (const side of [-1, 1] as const) {
      const port = side < 0 ? PRV_BODY.inlet : PRV_BODY.outlet;
      expect(hitsPort(side, port.y, 0)).toBe(false);
      expect(hitsPort(side, port.y, 0.2)).toBe(false);
      expect(hitsPort(side, port.y, 0.34)).toBe(true);
      expect(hitsPort(side, port.y + 0.31, 0)).toBe(true);
    }
  });
  it("feeds the inlet below the seat and leaves the outlet above it", () => {
    expect(PRV_BODY.inlet.y).toBeLessThan(-0.675);
    expect(PRV_BODY.outlet.y).toBeGreaterThan(-0.585);
    expect(PRV_BODY.inlet.y - PRV_BODY.inlet.radius).toBeGreaterThan(PRV_BODY.bottom);
    expect(PRV_BODY.outlet.y + PRV_BODY.outlet.radius).toBeLessThan(PRV_BODY.top);
    expect(hitsPort(-1, -0.6, 0)).toBe(true);
    expect(hitsPort(1, -0.7, 0)).toBe(true);
  });
  it("keeps all generated vertex coordinates finite in assembled and teaching-cutaway views", () => {
    for (const cut of [false, true]) {
      const geometry = createPRVBodyGeometry(cut);
      const positions = geometry.getAttribute("position");
      expect(positions.count).toBeGreaterThan(1000);
      for (let i = 0; i < positions.array.length; i++) expect(Number.isFinite(positions.array[i])).toBe(true);
      geometry.dispose();
    }
  });
});
