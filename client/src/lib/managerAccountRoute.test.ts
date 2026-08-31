import { describe, expect, it } from "vitest";
import { managerAccountDestination } from "./managerAccountRoute";

describe("manager account routing", () => {
  it("sends an active manager to the team dashboard", () => {
    expect(managerAccountDestination("")).toBe("/team");
  });

  it("preserves a team training-hours destination", () => {
    expect(managerAccountDestination("?next=%2Fteam%2Ftraining-hours"))
      .toBe("/team/training-hours");
  });

  it("does not send a manager to an individual or external destination", () => {
    expect(managerAccountDestination("?next=%2Faccount")).toBe("/team");
    expect(managerAccountDestination("?next=https%3A%2F%2Fevil.test"))
      .toBe("/team");
  });
});
