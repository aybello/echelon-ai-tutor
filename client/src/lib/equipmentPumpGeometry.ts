import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

export const PUMP_DISCHARGE = { x: -0.65, z: 0.36, radius: 0.2, bottom: 0.65, top: 1.75 } as const;

/** Spiral wall with a circular Y-axis discharge penetration, not an unconnected tube. */
export function createPumpVoluteGeometry(): BufferGeometry {
  const port = PUMP_DISCHARGE;
  const rows = new Set<number>([-1, -0.4]);
  for (let i = 0; i <= 32; i++) rows.add(port.x + port.radius * Math.sin(-Math.PI / 2 + Math.PI * i / 32));
  const xs = [...rows].sort((a, b) => a - b);
  const positions: number[] = [];
  const radius = (angle: number, outer: boolean) => (outer ? 0.94 : 0.78) + 0.25 * angle / (Math.PI * 2);
  const angleAtZ = (z: number, outer: boolean) => {
    let low = 0, high = Math.PI;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      if (-radius(mid, outer) * Math.cos(mid) < z) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  };
  const vertex = (x: number, outer: boolean, side: number, t: number) => {
    const halfSpan = Math.sqrt(Math.max(0, port.radius ** 2 - (x - port.x) ** 2));
    const start = side === 0 ? 0 : angleAtZ(port.z + halfSpan, outer);
    const end = side === 0 ? angleAtZ(port.z - halfSpan, outer) : Math.PI * 2;
    const angle = start + (end - start) * t, r = radius(angle, outer);
    return new Vector3(x, -0.1 + r * Math.sin(angle), -r * Math.cos(angle));
  };
  const triangle = (a: Vector3, b: Vector3, c: Vector3) => positions.push(...a.toArray(), ...b.toArray(), ...c.toArray());
  const quad = (a: Vector3, b: Vector3, c: Vector3, d: Vector3) => { triangle(a, b, c); triangle(a, c, d); };
  const segments = 64;
  for (const side of [0, 1]) {
    for (let j = 0; j < xs.length - 1; j++) {
      const a = xs[j], b = xs[j + 1];
      for (const outer of [false, true]) for (let i = 0; i < segments; i++) {
        quad(vertex(a, outer, side, i / segments), vertex(b, outer, side, i / segments),
          vertex(b, outer, side, (i + 1) / segments), vertex(a, outer, side, (i + 1) / segments));
      }
      for (const t of [0, 1]) quad(vertex(a, false, side, t), vertex(a, true, side, t),
        vertex(b, true, side, t), vertex(b, false, side, t));
    }
    for (const x of [-1, -0.4]) for (let i = 0; i < segments; i++) {
      quad(vertex(x, false, side, i / segments), vertex(x, true, side, i / segments),
        vertex(x, true, side, (i + 1) / segments), vertex(x, false, side, (i + 1) / segments));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
