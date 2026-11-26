import { describe, expect, it } from "vitest";
import {
  clarifierSolidsPoint,
  clarifierWaterPoint,
  equipmentCameraZoom,
} from "./equipmentClarifierModel";

describe("equipment clarifier illustration", () => {
  it("carries water outward and upward, but settled solids inward and down to the hopper", () => {
    for (const lane of [0, 0.12, 0.25, 0.5, 0.78]) {
      const radial = ([x, , z]: number[]) => Math.hypot(x, z);
      const inlet = clarifierWaterPoint(0, lane),
        outlet = clarifierWaterPoint(1, lane);
      expect(radial(outlet)).toBeGreaterThan(radial(inlet));
      expect(outlet[1]).toBeGreaterThan(inlet[1]);
      expect(radial(outlet)).toBeLessThan(3.5);
      const settled = clarifierSolidsPoint(0.45, lane),
        scraped = clarifierSolidsPoint(0.85, lane),
        withdrawn = clarifierSolidsPoint(1, lane);
      expect(settled[1]).toBeLessThan(clarifierSolidsPoint(0, lane)[1]);
      expect(radial(scraped)).toBeLessThan(radial(settled));
      expect(radial(withdrawn)).toBeCloseTo(0);
      expect(withdrawn[1]).toBeLessThan(scraped[1]);
    }
  });

  it("keeps the full apparatus within the narrow mobile camera frame, including exploded height", () => {
    for (const [width, height] of [
      [340, 380],
      [730, 560],
      [1024, 500],
    ]) {
      for (const exploded of [false, true]) {
        const zoom = equipmentCameraZoom(width, height, exploded);
        expect(12.8 * zoom).toBeLessThanOrEqual(width + 0.01);
        expect((exploded ? 10.5 : 9) * zoom).toBeLessThanOrEqual(height + 0.01);
      }
    }
  });
});
