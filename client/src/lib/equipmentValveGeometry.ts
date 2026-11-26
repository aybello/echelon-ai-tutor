import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

/** Conceptual globe body. Inlet enters BELOW the seat, outlet leaves ABOVE it. */
export const PRV_BODY = {
  radius: 0.86,
  innerRadius: 0.72,
  bottom: -1.25,
  top: 0.38,
  inlet: { y: -0.93, radius: 0.3 },
  outlet: { y: -0.35, radius: 0.3 },
} as const;

/**
 * Closed-thickness cylindrical wall, with actual circular X-axis cross-bores.
 * Each horizontal row trims the inner and outer surfaces to the exact bore Z
 * span, then joins them with the bore wall. No transparent-material shortcut.
 */
export function createPRVBodyGeometry(cut = false): BufferGeometry {
  const c = PRV_BODY;
  const rows = new Set<number>([c.bottom, c.top]);
  for (let i = 0; i <= 16; i++) rows.add(c.bottom + (c.top - c.bottom) * i / 16);
  for (const port of [c.inlet, c.outlet]) {
    for (let i = 0; i <= 32; i++) rows.add(port.y + port.radius * Math.sin(-Math.PI / 2 + Math.PI * i / 32));
  }
  const ys = [...rows].sort((a, b) => a - b);
  const positions: number[] = [];
  const span = (y: number, port: typeof c.inlet | typeof c.outlet) =>
    Math.sqrt(Math.max(0, port.radius ** 2 - (y - port.y) ** 2));
  const vertex = (y: number, r: number, side: number, t: number): Vector3 => {
    const right = Math.asin(span(y, c.outlet) / r);
    const left = Math.asin(span(y, c.inlet) / r);
    const start = side === 0 ? (cut ? Math.max(right, Math.PI / 2) : right) : Math.PI + left;
    const end = side === 0 ? Math.PI - left : Math.PI * 2 - right;
    const angle = start + (end - start) * t;
    return new Vector3(r * Math.cos(angle), y, r * Math.sin(angle));
  };
  const triangle = (a: Vector3, b: Vector3, d: Vector3) => positions.push(...a.toArray(), ...b.toArray(), ...d.toArray());
  const quad = (a: Vector3, b: Vector3, d: Vector3, e: Vector3) => { triangle(a, b, d); triangle(a, d, e); };
  const segments = 40;
  for (const side of [0, 1]) {
    for (let j = 0; j < ys.length - 1; j++) {
      const low = ys[j], high = ys[j + 1];
      for (const r of [c.radius, c.innerRadius]) {
        for (let i = 0; i < segments; i++) {
          quad(vertex(low, r, side, i / segments), vertex(low, r, side, (i + 1) / segments),
            vertex(high, r, side, (i + 1) / segments), vertex(high, r, side, i / segments));
        }
      }
      for (const t of [0, 1]) quad(vertex(low, c.radius, side, t), vertex(high, c.radius, side, t),
        vertex(high, c.innerRadius, side, t), vertex(low, c.innerRadius, side, t));
    }
    for (const y of [c.bottom, c.top]) for (let i = 0; i < segments; i++) {
      quad(vertex(y, c.radius, side, i / segments), vertex(y, c.radius, side, (i + 1) / segments),
        vertex(y, c.innerRadius, side, (i + 1) / segments), vertex(y, c.innerRadius, side, i / segments));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
