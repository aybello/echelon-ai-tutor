// Deliberately illustrative paths, not hydraulic or settling-rate predictions.
export type FlowPoint = [number, number, number];

export function clarifierWaterPoint(progress: number, lane: number): FlowPoint {
  const t = Math.max(0, Math.min(1, progress));
  const angle = lane * Math.PI * 2;
  const radius = 0.8 + 2.64 * t;
  return [Math.sin(angle) * radius, -0.12 + 0.78 * t, Math.cos(angle) * radius];
}

export function clarifierSolidsPoint(
  progress: number,
  lane: number
): FlowPoint {
  const t = Math.max(0, Math.min(1, progress));
  const angle = lane * Math.PI * 2;
  const outer = 1.8 + 0.9 * Math.sin(lane * 29) ** 2;
  let radius: number;
  let y: number;
  if (t < 0.45) {
    const settling = t / 0.45;
    radius = 0.8 + (outer - 0.8) * settling;
    y = -0.12 + (-1.095 + outer * 0.116 + 0.12) * settling;
  } else if (t < 0.85) {
    radius = outer + ((0.55 - outer) * (t - 0.45)) / 0.4;
    y = -1.095 + radius * 0.116;
  } else {
    radius = 0.55 * (1 - (t - 0.85) / 0.15);
    y = -1.0312 - (0.7438 * (t - 0.85)) / 0.15;
  }
  return [Math.sin(angle) * radius, y, Math.cos(angle) * radius];
}

// Fit the entire apparatus (including pipes and exploded labels) on narrow phones.
export function equipmentCameraZoom(
  width: number,
  height: number,
  exploded: boolean
) {
  return Math.max(
    12,
    Math.min(width / 12.8, height / (exploded ? 10.5 : 9), 66)
  );
}
