import { describe, expect, it } from "vitest";
import { clarifierCameraPosition, shouldAnimateClarifier, THREE_CLARIFIER_VIEWS } from "./ClarifierThreeLab";

describe("ClarifierThreeLab helpers", () => {
  it("provides a distinct camera target for each learning view", () => {
    expect(THREE_CLARIFIER_VIEWS.map((view) => view.id)).toEqual(["isometric", "top", "cutaway", "exploded"]);
    expect(clarifierCameraPosition("top")[1]).toBeGreaterThan(clarifierCameraPosition("isometric")[1]);
    expect(clarifierCameraPosition("exploded")).not.toEqual(clarifierCameraPosition("cutaway"));
  });

  it("stops scene animation when the learner requests reduced motion", () => {
    expect(shouldAnimateClarifier(true, false)).toBe(true);
    expect(shouldAnimateClarifier(true, true)).toBe(false);
    expect(shouldAnimateClarifier(false, false)).toBe(false);
  });
});
