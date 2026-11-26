import { BufferGeometry, Float32BufferAttribute, Path, Shape } from "three";

/** World-space dimensions shared by the floor opening and grit hopper. */
export const GRIT_HOPPER = {
  centerX: 1.2,
  topY: -1.18,
  bottomY: -1.84,
  topHalfX: 0.86,
  topHalfZ: 0.90,
  bottomHalfX: 0.34,
  bottomHalfZ: 0.40,
} as const;

/**
 * Extrude with depth 0.2 and bevelEnabled false, rotate X by Math.PI / 2,
 * then position Y at GRIT_HOPPER.topY. Shape Y becomes world Z; extrusion
 * depth extends downward. The opening is bounded on all four sides.
 */
export function createGritFloorShape(): Shape {
  const shape = new Shape();
  shape.moveTo(-3.2, -1.3);
  shape.lineTo(3.2, -1.3);
  shape.lineTo(3.2, 1.3);
  shape.lineTo(-3.2, 1.3);
  shape.closePath();

  const { centerX, topHalfX, topHalfZ } = GRIT_HOPPER;
  const opening = new Path();
  opening.moveTo(centerX - topHalfX, -topHalfZ);
  opening.lineTo(centerX - topHalfX, topHalfZ);
  opening.lineTo(centerX + topHalfX, topHalfZ);
  opening.lineTo(centerX + topHalfX, -topHalfZ);
  opening.closePath();
  shape.holes.push(opening);
  return shape;
}

type Point3 = readonly [number, number, number];
const PANEL_THICKNESS = 0.08;

/**
 * A rectangular four-panel frustum in actual world coordinates; do not apply
 * an additional placement transform. Inner top edges match the floor opening
 * exactly. Outer edges are offset 0.08 outward in X/Z, with horizontal top
 * lips joining the floor and a bottom plate closing the inner rectangle.
 * `cut` removes only the near (+Z) panel, capping the newly exposed side ends.
 */
export function createGritHopperGeometry(cut: boolean): BufferGeometry {
  const { centerX, topY, bottomY, topHalfX, topHalfZ, bottomHalfX, bottomHalfZ } = GRIT_HOPPER;
  const ring = (y: number, halfX: number, halfZ: number): Point3[] => [
    [centerX - halfX, y, -halfZ],
    [centerX + halfX, y, -halfZ],
    [centerX + halfX, y, halfZ],
    [centerX - halfX, y, halfZ],
  ];
  const top = ring(topY, topHalfX, topHalfZ);
  const bottom = ring(bottomY, bottomHalfX, bottomHalfZ);
  const outerTop = ring(topY, topHalfX + PANEL_THICKNESS, topHalfZ + PANEL_THICKNESS);
  const outerBottom = ring(bottomY, bottomHalfX + PANEL_THICKNESS, bottomHalfZ + PANEL_THICKNESS);
  const positions: number[] = [];
  const quad = (a: Point3, b: Point3, c: Point3, d: Point3): void => {
    positions.push(...a, ...b, ...c, ...a, ...c, ...d);
  };

  // Ring order: back (-Z), right (+X), near (+Z), left (-X).
  for (let side = 0; side < 4; side++) {
    if (cut && side === 2) continue;
    const next = (side + 1) % 4;
    quad(top[side], bottom[side], bottom[next], top[next]); // Inner panel.
    quad(outerTop[side], outerTop[next], outerBottom[next], outerBottom[side]);
    quad(top[side], top[next], outerTop[next], outerTop[side]); // Top lip.
    quad(bottom[side], outerBottom[side], outerBottom[next], bottom[next]);

    if (cut && side === 1) {
      quad(top[next], bottom[next], outerBottom[next], outerTop[next]);
    }
    if (cut && side === 3) {
      quad(top[side], outerTop[side], outerBottom[side], bottom[side]);
    }
  }
  // Rectangular bottom plate; the central downward ray reaches bottomY.
  quad(bottom[0], bottom[3], bottom[2], bottom[1]);

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
