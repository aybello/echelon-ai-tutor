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

  it("keeps only an explicitly selected personal billing view on Account", () => {
    expect(managerAccountDestination("?billing=personal")).toBeNull();
    expect(managerAccountDestination("billing=personal&next=%2Fteam")).toBeNull();
  });

  it.each([
    "?billing=team", "?billing=Personal", "?billing=", "?billing=personal-extra",
    "?billing=personal&billing=team", "?billing=personal&billing=personal",
    "?billing=personal&orgId=42", "?billing=personal&orgId=",
    "?next=%2Faccount%3Fbilling%3Dpersonal",
  ])("does not bypass the manager redirect for invalid personal query %s", search => {
    expect(managerAccountDestination(search)).toBe("/team");
  });

  it("does not send a manager to an individual or external destination", () => {
    expect(managerAccountDestination("?next=%2Faccount")).toBe("/team");
    expect(managerAccountDestination("?next=https%3A%2F%2Fevil.test"))
      .toBe("/team");
  });
});
