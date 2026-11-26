import { Path, Shape } from "three";

export interface TankPort { y: number; z: number; radius: number }
export interface TankEndPorts { left?: TankPort; right?: TankPort }

/** Assembled nozzle positions, in conceptual world units rather than site dimensions. */
export const EQUIPMENT_TANK_PORTS = {
  filter: { floor: -1.7, ends: { left: { y: 0.35, z: 0, radius: 0.22 }, right: { y: -1.49, z: 0, radius: 0.18 } } },
  liftStation: { floor: -1.8, ends: { left: { y: -0.15, z: 0, radius: 0.3 } } },
} satisfies Record<string, { floor: number; ends: TankEndPorts }>;

/** Local horizontal coordinate is -world Z after the wall's Y-axis rotation. */
export function createTankEndShape(width: number, floor: number, top: number, port?: TankPort): Shape {
  const shape = new Shape();
  shape.moveTo(-width / 2, floor);
  shape.lineTo(width / 2, floor);
  shape.lineTo(width / 2, top);
  shape.lineTo(-width / 2, top);
  shape.closePath();
  if (port) {
    if (port.radius <= 0 || port.y - port.radius <= floor || port.y + port.radius >= top || Math.abs(port.z) + port.radius >= width / 2) {
      throw new Error("Tank port must be fully bounded by the wall");
    }
    const hole = new Path();
    hole.absarc(-port.z, port.y, port.radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}
