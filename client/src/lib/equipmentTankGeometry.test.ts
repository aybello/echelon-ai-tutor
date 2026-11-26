import { describe, expect, it } from "vitest";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, ShapeGeometry, Vector3 } from "three";
import { createTankEndShape, EQUIPMENT_TANK_PORTS } from "./equipmentTankGeometry";

function wallContains(shape: ReturnType<typeof createTankEndShape>, z: number, y: number): boolean {
  const geometry = new ShapeGeometry(shape, 64);
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(geometry, material);
  mesh.updateMatrixWorld();
  const hit = new Raycaster(new Vector3(-z, y, 1), new Vector3(0, 0, -1)).intersectObject(mesh).length > 0;
  geometry.dispose(); material.dispose();
  return hit;
}

describe("Assembled equipment tank wall geometry", () => {
  it("keeps the unused lift-station end completely solid below and above its waterline", () => {
    const contract = EQUIPMENT_TANK_PORTS.liftStation;
    const shape = createTankEndShape(3.2, contract.floor, 0.85);
    expect(shape.holes).toHaveLength(0);
    for (const z of [-1.5, 0, 1.5]) for (const y of [-1.75, -1.0, -0.4, 0, 0.7]) expect(wallContains(shape, z, y)).toBe(true);
  });
  it("opens only the intended lift-station inlet and seals wall below the nozzle", () => {
    const contract = EQUIPMENT_TANK_PORTS.liftStation;
    const port = contract.ends.left;
    const shape = createTankEndShape(3.2, contract.floor, 0.85, port);
    expect(shape.holes).toHaveLength(1);
    expect(wallContains(shape, 0, port.y)).toBe(false);
    for (const y of [-1.75, -1.0, -0.5]) expect(wallContains(shape, 0, y)).toBe(true);
    expect(wallContains(shape, 0.35, port.y)).toBe(true);
  });
  it("matches both filter nozzle elevations and sizes without creating floor-height slots", () => {
    const contract = EQUIPMENT_TANK_PORTS.filter;
    expect(contract.ends.left).toEqual({ y: 0.35, z: 0, radius: 0.22 });
    expect(contract.ends.right).toEqual({ y: -1.49, z: 0, radius: 0.18 });
    for (const port of Object.values(contract.ends)) {
      const shape = createTankEndShape(3.2, contract.floor, 0.98, port);
      expect(shape.holes).toHaveLength(1);
      expect(wallContains(shape, port.z, port.y)).toBe(false);
      expect(wallContains(shape, port.radius + 0.02, port.y)).toBe(true);
      expect(wallContains(shape, 0, contract.floor + 0.01)).toBe(true);
      const points = shape.holes[0].getSpacedPoints(64);
      expect(Math.min(...points.map(point => point.y))).toBeCloseTo(port.y - port.radius, 4);
      expect(Math.max(...points.map(point => point.y))).toBeCloseTo(port.y + port.radius, 4);
      expect(port.y - port.radius).toBeGreaterThan(contract.floor);
    }
  });
  it("rejects any hole that breaks through the floor or another wall edge", () => {
    expect(() => createTankEndShape(3.2, -1.8, 0.85, { y: -1.7, z: 0, radius: 0.3 })).toThrow("fully bounded");
    expect(() => createTankEndShape(3.2, -1.8, 0.85, { y: 0, z: 1.5, radius: 0.3 })).toThrow("fully bounded");
  });
});
