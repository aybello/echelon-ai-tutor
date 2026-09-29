import assert from "node:assert/strict";
import test from "node:test";
import { buildRepairPlan } from "./restoreUtilitiesKingstonPopulatedDashboards.mjs";

const manager = (overrides = {}) => ({
  managerMemberId: 1,
  memberEmail: "manager@example.com",
  managerEmail: "manager@example.com",
  managerRole: "manager",
  managerStatus: "assigned",
  ...overrides,
});

const emptyDuplicate = (stream, id, seatsTotal, email, overrides = {}) => manager({
  organizationId: id,
  organizationName: stream === "distribution" ? "Utilities Kingston Distribution" : "Utilities Kingston Treatment",
  stream,
  seatsTotal,
  status: "active",
  memberEmail: email,
  managerEmail: email,
  operatorMembers: 0,
  questionAttempts: 0,
  examResults: 0,
  activitySessions: 0,
  subscriptions: 0,
  termUsage: 0,
  ...overrides,
});

const populatedOrganization = (id, seatsTotal, attempts) => manager({
  organizationId: id,
  organizationName: "Utilities Kingston",
  stream: null,
  seatsTotal,
  status: "active",
  operatorMembers: seatsTotal === 10 ? 7 : 7,
  questionAttempts: attempts,
});

test("plans a no-data-move repair to route Kingston managers to populated teams", () => {
  const plan = buildRepairPlan({
    duplicates: [
      emptyDuplicate("distribution", 6780001, 10, "distribution.manager@example.com"),
      emptyDuplicate("treatment", 6780002, 14, "treatment.manager@example.com"),
    ],
    populated: [
      populatedOrganization(90001, 10, 2403),
      populatedOrganization(90002, 14, 1340),
    ],
  });

  assert.equal(plan.routes.length, 2);
  assert.equal(plan.retiredEmptyDuplicates.length, 2);
  assert.equal(plan.learnerRecordsMoved, 0);
  assert.equal(plan.learnerRecordsDeleted, 0);
  assert.deepEqual(plan.routes.map(route => [route.seatCount, route.targetStream, route.historicalQuestionAttempts]), [
    [10, "distribution", 2403],
    [14, "treatment", 1340],
  ]);
  assert.match(plan.planDigest, /^[a-f0-9]{64}$/);
});

test("refuses to retire a duplicate with any learning or entitlement data", () => {
  assert.throws(() => buildRepairPlan({
    duplicates: [
      emptyDuplicate("distribution", 6780001, 10, "distribution.manager@example.com"),
      emptyDuplicate("treatment", 6780002, 14, "treatment.manager@example.com", { questionAttempts: 1 }),
    ],
    populated: [
      populatedOrganization(90001, 10, 2403),
      populatedOrganization(90002, 14, 1340),
    ],
  }), /not empty and active/);
});
