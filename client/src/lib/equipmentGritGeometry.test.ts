import { afterEach, describe, expect, it } from "vitest";
import {
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from "three";
import { createGritFloorShape, createGritHopperGeometry, GRIT_HOPPER } from "./equipmentGritGeometry";

const geometries: BufferGeometry[] = [];
const materials: MeshBasicMaterial[] = [];

afterEach(() => {
  geometries.splice(0).forEach(geometry => geometry.dispose());
  materials.splice(0).forEach(material => material.dispose());
});

function meshFor(geometry: BufferGeometry): Mesh {
  geometries.push(geometry);
  const material = new MeshBasicMaterial({ side: DoubleSide });
  materials.push(material);
  const mesh = new Mesh(geometry, material);
  mesh.updateMatrixWorld(true);
  return mesh;
}

function floorMesh(): Mesh {
  const mesh = meshFor(new ExtrudeGeometry(createGritFloorShape(), {
    depth: 0.2,
    bevelEnabled: false,
    steps: 1,
  }));
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = GRIT_HOPPER.topY;
  mesh.updateMatrixWorld(true);
  return mesh;
}

function down(x: number, z: number): Raycaster {
  return new Raycaster(new Vector3(x, 1, z), new Vector3(0, -1, 0));
}

describe("grit floor and hopper geometry", () => {
  it("exports the exact shared world-coordinate dimensions", () => {
    expect(GRIT_HOPPER).toEqual({
      centerX: 1.2,
      topY: -1.18,
      bottomY: -1.84,
      topHalfX: 0.86,
      topHalfZ: 0.90,
      bottomHalfX: 0.34,
      bottomHalfZ: 0.40,
    });
  });

  it("has one fully bounded rectangular opening inside the full floor rectangle", () => {
    const shape = createGritFloorShape();
    expect(shape.holes).toHaveLength(1);
    const outline = shape.getPoints();
    const hole = shape.holes[0].getPoints();
    expect(Math.min(...outline.map(point => point.x))).toBeCloseTo(-3.2, 8);
    expect(Math.max(...outline.map(point => point.x))).toBeCloseTo(3.2, 8);
    expect(Math.min(...outline.map(point => point.y))).toBeCloseTo(-1.3, 8);
    expect(Math.max(...outline.map(point => point.y))).toBeCloseTo(1.3, 8);
    expect(Math.min(...hole.map(point => point.x))).toBeCloseTo(0.34, 8);
    expect(Math.max(...hole.map(point => point.x))).toBeCloseTo(2.06, 8);
    expect(Math.min(...hole.map(point => point.y))).toBeCloseTo(-0.90, 8);
    expect(Math.max(...hole.map(point => point.y))).toBeCloseTo(0.90, 8);
    for (const point of hole) {
      expect(point.x).toBeGreaterThan(-3.2);
      expect(point.x).toBeLessThan(3.2);
      expect(point.y).toBeGreaterThan(-1.3);
      expect(point.y).toBeLessThan(1.3);
    }
  });

  it("hits floor top at x=1.2,z=1.0 and retains material on all four sides", () => {
    const floor = floorMesh();
    for (const [x, z] of [[1.2, 1.0], [1.2, -1.0], [0.3, 0], [2.1, 0], [-3.1, 0], [3.1, 0]]) {
      const hits = down(x, z).intersectObject(floor);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].point.y).toBeCloseTo(-1.18, 6);
    }
    expect(down(3.3, 0).intersectObject(floor)).toHaveLength(0);
    expect(down(0, 1.4).intersectObject(floor)).toHaveLength(0);
  });

  it.each([false, true])("lets the central ray pass the floor and reach the closed bottom (cut=%s)", cut => {
    const floor = floorMesh();
    const hopper = meshFor(createGritHopperGeometry(cut));
    const ray = down(GRIT_HOPPER.centerX, 0);
    expect(ray.intersectObject(floor)).toHaveLength(0);
    const hits = ray.intersectObjects([floor, hopper]);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].object).toBe(hopper);
    expect(hits[0].point.y).toBeCloseTo(-1.84, 6);
  });

  it("joins all four inner panel rims to the exact floor opening", () => {
    const floor = floorMesh();
    const hopper = meshFor(createGritHopperGeometry(false));
    const { centerX, topY, bottomY, topHalfX, topHalfZ, bottomHalfX, bottomHalfZ } = GRIT_HOPPER;
    const inset = 0.01;
    const probes = [
      { x: centerX - topHalfX + inset, z: 0, taper: topHalfX - bottomHalfX },
      { x: centerX + topHalfX - inset, z: 0, taper: topHalfX - bottomHalfX },
      { x: centerX, z: -topHalfZ + inset, taper: topHalfZ - bottomHalfZ },
      { x: centerX, z: topHalfZ - inset, taper: topHalfZ - bottomHalfZ },
    ];
    for (const { x, z, taper } of probes) {
      const ray = down(x, z);
      expect(ray.intersectObject(floor)).toHaveLength(0);
      const hits = ray.intersectObject(hopper);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].point.y).toBeCloseTo(topY - (inset / taper) * (topY - bottomY), 5);
    }

    const position = hopper.geometry.getAttribute("position");
    for (const x of [centerX - topHalfX, centerX + topHalfX]) {
      for (const z of [-topHalfZ, topHalfZ]) {
        let found = false;
        for (let i = 0; i < position.count; i++) {
          if (Math.abs(position.getX(i) - x) < 1e-6 &&
              Math.abs(position.getY(i) - topY) < 1e-6 &&
              Math.abs(position.getZ(i) - z) < 1e-6) found = true;
        }
        expect(found).toBe(true);
      }
    }
  });

  it("has inner and outer panel faces separated by 0.08 in X/Z, with floor-height top lips", () => {
    const hopper = meshFor(createGritHopperGeometry(false));
    const { centerX, topY, bottomY, topHalfX, topHalfZ, bottomHalfX, bottomHalfZ } = GRIT_HOPPER;
    const y = (topY + bottomY) / 2;
    const probes = [
      { direction: new Vector3(-1, 0, 0), half: (topHalfX + bottomHalfX) / 2 },
      { direction: new Vector3(1, 0, 0), half: (topHalfX + bottomHalfX) / 2 },
      { direction: new Vector3(0, 0, -1), half: (topHalfZ + bottomHalfZ) / 2 },
      { direction: new Vector3(0, 0, 1), half: (topHalfZ + bottomHalfZ) / 2 },
    ];
    for (const { direction, half } of probes) {
      const hits = new Raycaster(new Vector3(centerX, y, 0), direction).intersectObject(hopper);
      expect(hits.length).toBeGreaterThanOrEqual(2);
      expect(hits[0].distance).toBeCloseTo(half, 6);
      expect(hits[hits.length - 1].distance).toBeCloseTo(half + 0.08, 6);
    }
    for (const [x, z] of [
      [centerX - topHalfX - 0.04, 0], [centerX + topHalfX + 0.04, 0],
      [centerX, -topHalfZ - 0.04], [centerX, topHalfZ + 0.04],
    ]) {
      expect(down(x, z).intersectObject(hopper)[0].point.y).toBeCloseTo(topY, 6);
    }
  });

  it("omits only the near +Z panel in teaching view, retaining the other three walls", () => {
    const full = meshFor(createGritHopperGeometry(false));
    const cut = meshFor(createGritHopperGeometry(true));
    const origin = new Vector3(GRIT_HOPPER.centerX, (GRIT_HOPPER.topY + GRIT_HOPPER.bottomY) / 2, 0);
    const nearRay = new Raycaster(origin, new Vector3(0, 0, 1));
    expect(nearRay.intersectObject(full).length).toBeGreaterThan(0);
    expect(nearRay.intersectObject(cut)).toHaveLength(0);
    for (const direction of [new Vector3(-1, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 0, -1)]) {
      const ray = new Raycaster(origin, direction);
      const fullHits = ray.intersectObject(full);
      const cutHits = ray.intersectObject(cut);
      expect(cutHits.length).toBeGreaterThan(0);
      expect(cutHits[0].distance).toBeCloseTo(fullHits[0].distance, 6);
    }
  });

  it.each([false, true])("contains only finite positions, normals and bounds (cut=%s)", cut => {
    const geometry = createGritHopperGeometry(cut);
    geometries.push(geometry);
    for (const name of ["position", "normal"]) {
      const attribute = geometry.getAttribute(name);
      expect(attribute.count).toBeGreaterThan(0);
      expect(attribute.count % 3).toBe(0);
      for (const value of attribute.array) expect(Number.isFinite(value)).toBe(true);
    }
    expect(geometry.boundingBox).not.toBeNull();
    expect(geometry.boundingSphere).not.toBeNull();
    const bounds = geometry.boundingBox!;
    for (const value of [...bounds.min.toArray(), ...bounds.max.toArray(), ...geometry.boundingSphere!.center.toArray(), geometry.boundingSphere!.radius]) {
      expect(Number.isFinite(value)).toBe(true);
    }
    expect(bounds.max.y).toBeCloseTo(GRIT_HOPPER.topY, 6);
    expect(bounds.min.y).toBeCloseTo(GRIT_HOPPER.bottomY, 6);
    expect(bounds.min.x).toBeCloseTo(GRIT_HOPPER.centerX - GRIT_HOPPER.topHalfX - 0.08, 6);
    expect(bounds.max.x).toBeCloseTo(GRIT_HOPPER.centerX + GRIT_HOPPER.topHalfX + 0.08, 6);
    expect(bounds.min.z).toBeCloseTo(-GRIT_HOPPER.topHalfZ - 0.08, 6);
  });
});
