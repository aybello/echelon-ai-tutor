import assert from "node:assert/strict";
import test from "node:test";
import {
  UTILITIES_KINGSTON_RECOVERY_KEY,
  assertRecoveryEvidenceRows,
  confirmationTokenForPlan,
  deriveOneYearTerm,
  recoveryExternalReference,
  recoveryPlanDigest,
  safeRecoverySummary,
  validateUtilitiesKingstonPlan,
} from "./utilitiesKingstonRecovery.mjs";
import { assertExpectedDelta, expectedDelta, preflightDigest } from "./restoreUtilitiesKingston.mjs";

const plan = {
  version: 1,
  recoveryKey: UTILITIES_KINGSTON_RECOVERY_KEY,
  authorizationRef: "owner-approved-session-2026-09-18-utilities-kingston",
  sourceArchive: {
    path: "/private/verified-stripe.csv",
    sha256: "a".repeat(64),
  },
  groups: [
    {
      group: "treatment",
      seatCount: 14,
      sourceEvidenceKey: "stripe:payment:payment-treatment-example",
      organizationName: "Utilities Kingston Treatment",
    },
    {
      group: "distribution",
      seatCount: 10,
      sourceEvidenceKey: "stripe:payment:payment-distribution-example",
      organizationName: "Utilities Kingston Distribution",
    },
  ],
};

function evidenceFor(sourceEvidenceKey, seatCount, paymentCreatedAt = new Date("2026-06-19T15:45:00.000Z")) {
  return {
    id: seatCount,
    sourceEvidenceKey,
    normalizedEmail: `manager-${seatCount}@example.org`,
    customerEmail: `manager-${seatCount}@example.org`,
    paymentStatus: "succeeded",
    paymentCreatedAt,
    recoverySubjectType: "organization_manager",
    recoveryOrganizationGroup: "unspecified",
    recoverySeatCount: seatCount,
    reviewStatus: "staged",
    importedAt: null,
  };
}

test("validates the approved two-dashboard, 14/10 Utilities Kingston plan", () => {
  const validated = validateUtilitiesKingstonPlan(plan);
  assert.deepEqual(validated.groups.map((group) => group.group), ["distribution", "treatment"]);
  assert.match(recoveryPlanDigest(plan), /^[a-f0-9]{64}$/);
  assert.match(confirmationTokenForPlan(plan), /^APPLY_UTILITIES_KINGSTON_[A-F0-9]{24}$/);
  assert.equal(recoveryExternalReference(plan.recoveryKey, "treatment"), `${plan.recoveryKey}:treatment`.replace(/^/, "recovery:"));
});

test("rejects a plan that combines dashboards, alters seats, or reuses evidence", () => {
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [plan.groups[0], { ...plan.groups[1], organizationName: plan.groups[0].organizationName }] }), /separate dashboard/);
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [{ ...plan.groups[0], seatCount: 13 }, plan.groups[1]] }), /14\/10/);
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [plan.groups[0], { ...plan.groups[1], sourceEvidenceKey: plan.groups[0].sourceEvidenceKey }] }), /reuse an evidence key/);
});

test("calculates annual terms with calendar-safe leap-day behavior", () => {
  const ordinary = deriveOneYearTerm("2026-06-19T15:45:00.000Z");
  assert.equal(ordinary.startsAt.toISOString(), "2026-06-19T15:45:00.000Z");
  assert.equal(ordinary.endsAt.toISOString(), "2027-06-19T15:45:00.000Z");
  const leap = deriveOneYearTerm("2024-02-29T08:30:00.000Z");
  assert.equal(leap.endsAt.toISOString(), "2025-02-28T08:30:00.000Z");
});

test("requires exactly two successful, unimported organization-manager evidence rows", () => {
  const rows = [
    evidenceFor(plan.groups[0].sourceEvidenceKey, 14),
    evidenceFor(plan.groups[1].sourceEvidenceKey, 10),
  ];
  assert.doesNotThrow(() => assertRecoveryEvidenceRows(plan, rows));
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], paymentStatus: "refunded" }, rows[1]]), /successful/);
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], importedAt: new Date() }, rows[1]]), /already imported/);
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], recoverySeatCount: 15 }, rows[1]]), /seat evidence/);
  assert.throws(() => assertRecoveryEvidenceRows(plan, [rows[0], { ...rows[1], customerEmail: rows[0].customerEmail, normalizedEmail: rows[0].normalizedEmail }]), /distinct manager identities/);
});

test("produces a safe preflight summary with no seat grants or outbound operations", () => {
  const rows = [
    evidenceFor(plan.groups[0].sourceEvidenceKey, 14),
    evidenceFor(plan.groups[1].sourceEvidenceKey, 10),
  ];
  const summary = safeRecoverySummary(plan, rows);
  assert.equal(summary.groups.length, 2);
  assert.equal(summary.expectedChanges.operatorMemberships, 0);
  assert.equal(summary.expectedChanges.subscriptions, 0);
  assert.equal(summary.expectedChanges.outboundEmails, 0);
  assert.equal(summary.expectedChanges.stripeRequests, 0);
});

test("requires exact recovery-only database deltas", () => {
  const before = {
    customer_recovery_evidence: 33,
    customer_recovery_batches: 0,
    customer_recovery_import_items: 0,
    organizations: 0,
    organization_members: 0,
    organization_term_operator_usage: 0,
    subscriptions: 0,
    team_flex_licences: 0,
    purchases: 1,
    users: 1,
  };
  const after = {
    ...before,
    customer_recovery_batches: 1,
    customer_recovery_import_items: 2,
    organizations: 2,
    organization_members: 2,
  };
  assert.doesNotThrow(() => assertExpectedDelta(expectedDelta(before, after)));
  assert.throws(() => assertExpectedDelta(expectedDelta(before, { ...after, subscriptions: 1 })), /subscriptions/);
});

test("binds recovery preflight digests to immutable report content", () => {
  const document = { recoveryKey: plan.recoveryKey, planDigest: recoveryPlanDigest(plan), generatedAtUtc: "2026-09-18T00:00:00.000Z", safety: { sendsEmail: false } };
  const first = preflightDigest(document);
  const second = preflightDigest({ ...document, generatedAtUtc: "2026-09-18T01:00:00.000Z" });
  assert.equal(first, second);
  assert.notEqual(first, preflightDigest({ ...document, safety: { sendsEmail: true } }));
});
