/**
 * Aeration basin geometry helpers.
 *
 * Deliberately illustrative paths, not hydraulic, oxygen-transfer or
 * biological-kinetics predictions. The goal is to make the flow relationships
 * legible to an operator: mixed liquor travels the length of the basin, air
 * rises from the floor grid, and sludge is returned or wasted at the far end.
 *
 * Basin is modelled as a rectangular tank centred on the origin:
 *   x from -LENGTH/2 to +LENGTH/2 (flow direction)
 *   y from -DEPTH to 0 (water surface at y = 0)
 *   z from -WIDTH/2 to +WIDTH/2
 */

export type FlowPoint = [number, number, number];

export const BASIN_LENGTH = 7.2;
export const BASIN_WIDTH = 3.0;
export const BASIN_DEPTH = 2.1;

/**
 * Mixed liquor travelling the basin in a gentle serpentine roll.
 * `progress` 0 to 1 runs inlet to outlet; `lane` 0 to 1 spreads across width.
 */
export function mixedLiquorPoint(progress: number, lane: number): FlowPoint {
  const t = Math.max(0, Math.min(1, progress));
  const x = -BASIN_LENGTH / 2 + BASIN_LENGTH * t;
  // Lanes spread across the basin width, with a slight inward pinch at the ends.
  const spread = 0.78 * Math.sin(Math.PI * (0.12 + 0.76 * t));
  const z = (lane - 0.5) * BASIN_WIDTH * spread;
  // Rolling circulation: liquid rises over the diffuser grid and sinks between.
  const roll = Math.sin(t * Math.PI * 3 + lane * Math.PI * 2);
  const y = -BASIN_DEPTH * 0.5 + roll * BASIN_DEPTH * 0.3;
  return [x, y, z];
}

/**
 * Air bubbles rising from the floor diffuser grid to the surface.
 * `progress` 0 at the diffuser, 1 at the water surface.
 */
export function airBubblePoint(progress: number, lane: number): FlowPoint {
  const t = Math.max(0, Math.min(1, progress));
  // Diffuser grid covers the first three quarters of the basin floor.
  const gridSpan = BASIN_LENGTH * 0.74;
  const x = -BASIN_LENGTH / 2 + 0.5 + (lane * 7919 % 1) * gridSpan;
  const z = ((lane * 104729) % 1 - 0.5) * BASIN_WIDTH * 0.82;
  // Bubbles accelerate and wander slightly as they rise.
  const y = -BASIN_DEPTH * 0.92 + BASIN_DEPTH * 0.92 * Math.pow(t, 0.78);
  const wander = Math.sin(t * Math.PI * 2 + lane * 31) * 0.07;
  return [x + wander, y, z + wander * 0.6];
}

/**
 * Return activated sludge travelling from the outlet end back to the inlet
 * through an external pipe run beneath the basin.
 */
export function returnSludgePoint(progress: number): FlowPoint {
  const t = Math.max(0, Math.min(1, progress));
  const belowFloor = -BASIN_DEPTH - 0.42;
  if (t < 0.18) {
    // Drop down from the outlet end.
    const d = t / 0.18;
    return [BASIN_LENGTH / 2 + 0.5, -BASIN_DEPTH * 0.6 + (belowFloor + BASIN_DEPTH * 0.6) * d, BASIN_WIDTH * 0.62];
  }
  if (t < 0.82) {
    // Travel back along the basin.
    const d = (t - 0.18) / 0.64;
    return [BASIN_LENGTH / 2 + 0.5 - (BASIN_LENGTH + 1.0) * d, belowFloor, BASIN_WIDTH * 0.62];
  }
  // Rise into the inlet channel.
  const d = (t - 0.82) / 0.18;
  return [-BASIN_LENGTH / 2 - 0.5, belowFloor + (belowFloor * -1 - BASIN_DEPTH * 0.25) * d, BASIN_WIDTH * 0.62];
}

/** Fit the basin, pipes and exploded labels on narrow phones. */
export function aerationCameraZoom(
  width: number,
  height: number,
  exploded: boolean
) {
  // The structure now extends well beyond the tank walls: a ground slab, the
  // blower skid on grade at the inlet end, the launder past the weir, and the
  // RAS run below the floor. The framing divisors below are the full modelled
  // extents, so nothing gets clipped at the edge of the frame.
  //
  // The exploded view lifts the blower above the basin and places its label
  // above the part again, so it needs more vertical headroom than the
  // assembled views or the top label clips against the frame.
  return Math.max(
    10,
    Math.min(width / 13.4, height / (exploded ? 13.2 : 8.9), 70)
  );
}
