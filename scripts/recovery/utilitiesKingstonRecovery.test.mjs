import assert from "node:assert/strict";
import test from "node:test";
import {
  UTILITIES_KINGSTON_RECOVERY_KEY,
  assertApprovedUtilitiesKingstonPlan,
  assertRecoveryEvidenceRows,
  confirmationTokenForPlan,
  deriveOneYearTerm,
  recoveryExternalReference,
  recoveryPlanDigest,
  safeRecoverySummary,
  sha256,
  stableJson,
  validateUtilitiesKingstonPlan,
} from "./utilitiesKingstonRecovery.mjs";
import { assertExpectedDelta, assertRecoveryStartingState, decryptBackup, encryptBackup, evidenceBindingDigest, expectedDelta, preflightDigest } from "./restoreUtilitiesKingston.mjs";

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
      managerEmail: "manager-14@example.org",
      managerIdentitySha256: sha256("manager-14@example.org"),
      paymentIdentitySha256: sha256("manager-14@example.org"),
      organizationName: "Utilities Kingston Treatment",
    },
    {
      group: "distribution",
      seatCount: 10,
      sourceEvidenceKey: "stripe:payment:payment-distribution-example",
      managerEmail: "manager-10@example.org",
      managerIdentitySha256: sha256("manager-10@example.org"),
      paymentIdentitySha256: sha256("manager-10@example.org"),
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
    recoveryOrganizationGroup: seatCount === 14 ? "treatment" : "distribution",
    recoverySeatCount: seatCount,
    reviewStatus: "approved",
    importedAt: null,
  };
}

test("validates the approved two-dashboard, 14/10 Utilities Kingston plan", () => {
  const validated = validateUtilitiesKingstonPlan(plan);
  assert.deepEqual(validated.groups.map((group) => group.group), ["distribution", "treatment"]);
  assert.match(recoveryPlanDigest(plan), /^[a-f0-9]{64}$/);
  assert.match(confirmationTokenForPlan(plan), /^APPLY_UTILITIES_KINGSTON_[A-F0-9]{24}$/);
  assert.equal(recoveryExternalReference(plan.recoveryKey, "treatment"), `${plan.recoveryKey}:treatment`.replace(/^/, "recovery:"));
  assert.throws(() => assertApprovedUtilitiesKingstonPlan(plan), /owner-approved/);
});

test("rejects a plan that combines dashboards, alters seats, or reuses evidence", () => {
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [plan.groups[0], { ...plan.groups[1], organizationName: plan.groups[0].organizationName }] }), /separate dashboard/);
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [{ ...plan.groups[0], seatCount: 13 }, plan.groups[1]] }), /14\/10/);
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [plan.groups[0], { ...plan.groups[1], sourceEvidenceKey: plan.groups[0].sourceEvidenceKey }] }), /reuse an evidence key/);
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [plan.groups[0], { ...plan.groups[1], managerIdentitySha256: plan.groups[0].managerIdentitySha256 }] }), /reuse a manager identity/);
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [plan.groups[0], { ...plan.groups[1], managerEmail: plan.groups[0].managerEmail, managerIdentitySha256: sha256(plan.groups[0].managerEmail) }] }), /reuse a manager identity/);
  assert.throws(() => validateUtilitiesKingstonPlan({ ...plan, groups: [plan.groups[0], { ...plan.groups[1], paymentIdentitySha256: plan.groups[0].paymentIdentitySha256 }] }), /distinct payment identity/);
});

test("calculates annual terms with calendar-safe leap-day behavior", () => {
  const ordinary = deriveOneYearTerm("2026-06-19T15:45:00.000Z");
  assert.equal(ordinary.startsAt.toISOString(), "2026-06-19T15:45:00.000Z");
  assert.equal(ordinary.endsAt.toISOString(), "2027-06-19T15:45:00.000Z");
  const leap = deriveOneYearTerm("2024-02-29T08:30:00.000Z");
  assert.equal(leap.endsAt.toISOString(), "2025-02-28T08:30:00.000Z");
  assert.throws(() => deriveOneYearTerm(1_700_000_000), /ISO timestamp or Date/);
  assert.throws(() => deriveOneYearTerm("2026-06-19 15:45:00"), /ISO UTC/);
});

test("requires exactly two successful, unimported organization-manager evidence rows", () => {
  const rows = [
    evidenceFor(plan.groups[0].sourceEvidenceKey, 14),
    evidenceFor(plan.groups[1].sourceEvidenceKey, 10),
  ];
  assert.doesNotThrow(() => assertRecoveryEvidenceRows(plan, rows));
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], paymentStatus: "refunded" }, rows[1]]), /successful/);
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], importedAt: new Date() }, rows[1]]), /already imported/);
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], reviewStatus: "rejected" }, rows[1]]), /explicit approval/);
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], recoverySeatCount: 15 }, rows[1]]), /seat evidence/);
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], normalizedEmail: "other@example.org" }, rows[1]]), /payment identity/);
  assert.throws(() => assertRecoveryEvidenceRows(plan, [{ ...rows[0], recoveryOrganizationGroup: "distribution" }, rows[1]]), /group mapping/);
  assert.throws(() => assertRecoveryEvidenceRows({ ...plan, groups: [{ ...plan.groups[0], managerIdentitySha256: sha256("other@example.org") }, plan.groups[1]] }, rows), /identity does not match/);
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
  assert.throws(() => safeRecoverySummary(plan, [{ ...rows[0], paymentStatus: "disputed" }, rows[1]]), /successful/);
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
  assert.throws(() => assertExpectedDelta({ ...expectedDelta(before, after), unexpected_side_effect: 0 }), /ledger is incomplete/);
});

test("binds recovery preflight digests to immutable report content", () => {
  const rows = [
    evidenceFor(plan.groups[0].sourceEvidenceKey, 14),
    evidenceFor(plan.groups[1].sourceEvidenceKey, 10),
  ];
  const document = { recoveryKey: plan.recoveryKey, planDigest: recoveryPlanDigest(plan), evidenceBindingDigest: evidenceBindingDigest(rows), generatedAtUtc: "2026-09-18T00:00:00.000Z", safety: { sendsEmail: false } };
  const first = preflightDigest(document);
  const second = preflightDigest({ ...document, generatedAtUtc: "2026-09-18T01:00:00.000Z" });
  assert.equal(first, second);
  assert.notEqual(first, preflightDigest({ ...document, safety: { sendsEmail: true } }));
  assert.notEqual(document.evidenceBindingDigest, evidenceBindingDigest([{ ...rows[0], recoverySeatCount: 15 }, rows[1]]));
  assert.notEqual(document.evidenceBindingDigest, evidenceBindingDigest([{ ...rows[0], importedAt: new Date("2026-09-18T02:00:00.000Z") }, rows[1]]));
});

test("requires an empty zero-start state for the one-time organization import", () => {
  const counts = {
    customer_recovery_batches: 0,
    customer_recovery_import_items: 0,
    organizations: 0,
    organization_members: 0,
  };
  assert.doesNotThrow(() => assertRecoveryStartingState(counts));
  assert.throws(() => assertRecoveryStartingState({ ...counts, organizations: 2 }), /organizations/);
  assert.throws(() => assertRecoveryStartingState({ ...counts, organization_members: 1 }), /organization_members/);
});

test("rejects a recovery backup when the supplied escrow key differs", () => {
  const key = Buffer.alloc(32, 7);
  const snapshot = { counts: { organizations: 0 }, capturedAt: new Date("2026-09-18T00:00:00.000Z") };
  const backup = encryptBackup(snapshot, key);
  assert.equal(stableJson(decryptBackup(backup, key)), stableJson(snapshot));
  assert.throws(() => decryptBackup(backup, Buffer.alloc(32, 8)), /key does not match/);
  assert.throws(() => decryptBackup(backup.subarray(0, 20), key), /truncated/);
});
