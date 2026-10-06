import assert from "node:assert/strict";
import test from "node:test";
import {
  CORRECTION_KEY,
  buildCorrectionPlan,
  identityHash,
  parseArgs,
} from "./correctUtilitiesKingstonManagerMapping.mjs";

const distributionIdentity = "distribution-manager@example.test";
const treatmentIdentity = "treatment-manager@example.test";

function rows(overrides = {}) {
  return [
    {
      organizationId: 30001,
      organizationName: "Utilities Kingston Distribution",
      stream: "distribution",
      seatsTotal: 10,
      managerEmail: distributionIdentity,
      memberId: 40001,
      memberEmail: distributionIdentity,
      memberRole: "manager",
      memberStatus: "assigned",
      ...overrides.distribution,
    },
    {
      organizationId: 30002,
      organizationName: "Utilities Kingston Treatment",
      stream: "treatment",
      seatsTotal: 14,
      managerEmail: treatmentIdentity,
      memberId: 40002,
      memberEmail: treatmentIdentity,
      memberRole: "manager",
      memberStatus: "assigned",
      ...overrides.treatment,
    },
  ];
}

test("plans only a two-dashboard identity swap with no learner or entitlement mutation", () => {
  const plan = buildCorrectionPlan(rows());
  assert.equal(plan.correctionKey, CORRECTION_KEY);
  assert.match(plan.planDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(plan.organizations.map(row => row.stream), ["distribution", "treatment"]);
  assert.equal(plan.organizations.find(row => row.stream === "treatment").correctedManagerIdentitySha256, identityHash(distributionIdentity));
  assert.equal(plan.organizations.find(row => row.stream === "distribution").correctedManagerIdentitySha256, identityHash(treatmentIdentity));
  assert.deepEqual(plan.invariants, {
    organizationRowsCreated: 0,
    organizationRowsDeleted: 0,
    operatorMembershipsCreated: 0,
    operatorMembershipsDeleted: 0,
    learnerRecordsChanged: 0,
    entitlementRowsChanged: 0,
  });
});

test("rejects any incomplete, mismatched, or unsafe organization state", () => {
  assert.throws(() => buildCorrectionPlan(rows().slice(0, 1)), /exactly two/i);
  assert.throws(() => buildCorrectionPlan(rows({ treatment: { managerEmail: distributionIdentity } })), /distinct/i);
  assert.throws(() => buildCorrectionPlan(rows({ treatment: { memberEmail: "other@example.test" } })), /must match/i);
  assert.throws(() => buildCorrectionPlan(rows({ distribution: { memberRole: "operator" } })), /active manager/i);
  assert.throws(() => buildCorrectionPlan(rows({ distribution: { organizationName: "Unexpected" } })), /names/i);
});

test("requires a valid exact plan digest before apply mode", () => {
  assert.deepEqual(parseArgs([]), { mode: "plan", planDigest: null });
  assert.throws(() => parseArgs(["apply"]), /plan-digest/i);
  assert.throws(() => parseArgs(["apply", "--plan-digest", "nope"]), /plan-digest/i);
  assert.deepEqual(parseArgs(["apply", "--plan-digest", "a".repeat(64)]), { mode: "apply", planDigest: "a".repeat(64) });
});
