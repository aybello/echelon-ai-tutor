import { describe, expect, it } from "vitest";
import type { TeamFlexLicence } from "../../drizzle/schema";
import { planFlexBulkOnboarding, type FlexBulkRowInput } from "./flexBulkOnboardingService";

const now = new Date("2026-08-11T12:00:00Z");

function licence(
  id: number,
  courseKey: string,
  activationDeadline: string,
  status = "unused",
  invitedEmail: string | null = null,
): TeamFlexLicence {
  return {
    id,
    orderItemId: 1,
    organizationId: 10,
    courseKey,
    termMonths: 6,
    status,
    invitedEmail,
    invitationToken: null,
    invitedAt: null,
    operatorUserId: null,
    assignedAt: null,
    activatedAt: null,
    accessEndsAt: null,
    originalAccessEndsAt: null,
    reportingEndsAt: null,
    extensionApplied: false,
    extensionStartsAt: null,
    activationDeadline: new Date(activationDeadline),
    startsAt: null,
    suspendedAt: null,
    suspendedReason: null,
    revokedAt: null,
    revokeReason: null,
    previousStatus: null,
    replacedByLicenceId: null,
    replacesLicenceId: null,
    createdAt: now,
  };
}

function row(id: number, email: string, courseKey: string): FlexBulkRowInput {
  return { clientRowId: `row-${id}`, operatorEmail: email, courseKey };
}

describe("Course Pass bulk onboarding planner", () => {
  it("allocates the oldest-expiring paid licence first", () => {
    const plan = planFlexBulkOnboarding(
      [row(1, "first@winnipeg.ca", "wpi-class1-water-coll"), row(2, "second@winnipeg.ca", "wpi-class1-water-coll")],
      [
        licence(20, "wpi-class1-water-coll", "2027-08-11T12:00:00Z"),
        licence(10, "wpi-class1-water-coll", "2027-01-11T12:00:00Z"),
      ],
      now,
    );
    expect(plan.preview.valid).toBe(true);
    expect(plan.preview.rows.map((item) => item.licenceId)).toEqual([10, 20]);
  });

  it("matches legacy collection aliases to canonical inventory", () => {
    const plan = planFlexBulkOnboarding(
      [row(1, "operator@winnipeg.ca", "wpi-class1-water-coll")],
      [licence(1, "wpi-class1-wastewater-coll", "2027-08-11T12:00:00Z")],
      now,
    );
    expect(plan.preview.valid).toBe(true);
    expect(plan.preview.rows[0]).toMatchObject({ courseKey: "wpi-class1-water-coll", licenceId: 1 });
  });

  it("rejects duplicate operator and course rows before reserving inventory", () => {
    const plan = planFlexBulkOnboarding(
      [row(1, "operator@winnipeg.ca", "wpi-class1-water-coll"), row(2, "OPERATOR@winnipeg.ca", "wpi-class1-wastewater-coll")],
      [
        licence(1, "wpi-class1-water-coll", "2027-08-11T12:00:00Z"),
        licence(2, "wpi-class1-water-coll", "2027-08-11T12:00:00Z"),
      ],
      now,
    );
    expect(plan.preview.valid).toBe(false);
    expect(plan.preview.rows[1].errorCode).toBe("duplicate_row");
  });

  it("rejects an operator who already has the same canonical course", () => {
    const plan = planFlexBulkOnboarding(
      [row(1, "operator@winnipeg.ca", "wpi-class1-water-coll")],
      [
        licence(1, "wpi-class1-wastewater-coll", "2027-08-11T12:00:00Z", "invited", "operator@winnipeg.ca"),
        licence(2, "wpi-class1-water-coll", "2027-08-11T12:00:00Z"),
      ],
      now,
    );
    expect(plan.preview.valid).toBe(false);
    expect(plan.preview.rows[0].errorCode).toBe("duplicate_assignment");
  });

  it("rejects over-allocation without assigning any invalid row", () => {
    const plan = planFlexBulkOnboarding(
      [row(1, "one@winnipeg.ca", "wpi-class2-water-coll"), row(2, "two@winnipeg.ca", "wpi-class2-water-coll")],
      [licence(1, "wpi-class2-water-coll", "2027-08-11T12:00:00Z")],
      now,
    );
    expect(plan.preview.valid).toBe(false);
    expect(plan.preview.rows[0].valid).toBe(true);
    expect(plan.preview.rows[1].errorCode).toBe("no_inventory");
  });

  it("supports a ten-operator cohort without a fixed course mix", () => {
    const rows = Array.from({ length: 10 }, (_, index) => row(index, `operator${index}@winnipeg.ca`, index < 6 ? "wpi-class1-water-coll" : "wpi-class3-water-coll"));
    const licences = Array.from({ length: 10 }, (_, index) => licence(index + 1, index < 6 ? "wpi-class1-water-coll" : "wpi-class3-water-coll", "2027-08-11T12:00:00Z"));
    const plan = planFlexBulkOnboarding(rows, licences, now);
    expect(plan.preview.valid).toBe(true);
    expect(plan.preview.requested).toBe(10);
    expect(plan.assignments).toHaveLength(10);
  });
});
