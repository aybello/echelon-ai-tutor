import assert from "node:assert/strict";
import test from "node:test";
import {
  CORRECTION_KEY,
  buildCorrectionPlan,
  identityHash,
  parseArgs,
} from "./correctUtilitiesKingstonActiveManagerRouting.mjs";

const distributionManager = "distribution-manager@example.test";
const treatmentManager = "treatment-manager@example.test";

function row({ label, seatCount, managerEmail, memberEmail = managerEmail, overrides = {} }) {
  const isDistribution = label === "distribution";
  return {
    organizationId: isDistribution ? 90001 : 90002,
    organizationName: `Utilities Kingston ${label[0].toUpperCase()}${label.slice(1)}`,
    stream: label,
    status: "active",
    seatsTotal: seatCount,
    managerEmail,
    memberId: isDistribution ? 40001 : 40002,
    memberEmail,
    memberRole: "manager",
    memberStatus: "assigned",
    assignedOperators: 7,
    distributionOrCollectionAssignments: isDistribution ? 0 : 7,
    nonDistributionAssignments: isDistribution ? 7 : 0,
    questionAttempts: 42,
    examResults: 3,
    activitySessions: 9,
    subscriptions: 7,
    termUsage: 7,
    incomingManagerMembershipConflicts: 0,
    ...overrides,
  };
}

function rows(overrides = {}) {
  return [
    row({ label: "distribution", seatCount: 10, managerEmail: distributionManager, overrides: overrides.distribution }),
    row({ label: "treatment", seatCount: 14, managerEmail: treatmentManager, overrides: overrides.treatment }),
  ];
}

test("plans exactly one active routing swap and preserves all protected invariants", () => {
  const plan = buildCorrectionPlan(rows());
  assert.equal(plan.correctionKey, CORRECTION_KEY);
  assert.match(plan.planDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(plan.routes.map(item => item.currentLabel), ["distribution", "treatment"]);
  assert.equal(plan.routes[0].correctedLabel, "treatment");
  assert.equal(plan.routes[0].correctedManagerIdentitySha256, identityHash(treatmentManager));
  assert.equal(plan.routes[1].correctedLabel, "distribution");
  assert.equal(plan.routes[1].correctedManagerIdentitySha256, identityHash(distributionManager));
  assert.deepEqual(plan.invariants, {
    organizationRowsCreated: 0,
    organizationRowsDeleted: 0,
    operatorMembershipsCreated: 0,
    operatorMembershipsDeleted: 0,
    learnerRecordsChanged: 0,
    entitlementRowsChanged: 0,
    paymentRowsChanged: 0,
    commercialTermsChanged: 0,
  });
});

test("fails closed for an unexpected, empty, or unsafe roster state", () => {
  assert.throws(() => buildCorrectionPlan(rows().slice(0, 1)), /exactly two/i);
  assert.throws(() => buildCorrectionPlan(rows({ treatment: { managerEmail: distributionManager, memberEmail: distributionManager } })), /distinct/i);
  assert.throws(() => buildCorrectionPlan(rows({ distribution: { organizationName: "Unexpected" } })), /scope/i);
  assert.throws(() => buildCorrectionPlan(rows({ treatment: { assignedOperators: 0 } })), /not populated/i);
  assert.throws(() => buildCorrectionPlan(rows({ distribution: { memberEmail: "other@example.test" } })), /not aligned/i);
  assert.throws(() => buildCorrectionPlan(rows({ treatment: { incomingManagerMembershipConflicts: 1 } })), /already has another membership/i);
  assert.throws(() => buildCorrectionPlan(rows({ distribution: { distributionOrCollectionAssignments: 1 } })), /verified treatment cohort/i);
  assert.throws(() => buildCorrectionPlan(rows({ treatment: { nonDistributionAssignments: 1 } })), /verified distribution cohort/i);
});

test("requires a valid exact plan digest for apply mode", () => {
  assert.deepEqual(parseArgs([]), { mode: "plan", planDigest: null });
  assert.throws(() => parseArgs(["apply"]), /plan-digest/i);
  assert.throws(() => parseArgs(["apply", "--plan-digest", "invalid"]), /plan-digest/i);
  assert.deepEqual(parseArgs(["apply", "--plan-digest", "a".repeat(64)]), {
    mode: "apply",
    planDigest: "a".repeat(64),
  });
});
