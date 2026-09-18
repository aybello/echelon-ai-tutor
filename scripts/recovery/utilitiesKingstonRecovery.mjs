import { createHash } from "node:crypto";

export const UTILITIES_KINGSTON_RECOVERY_KEY = "utilities-kingston-annual-recovery-v1";
export const UTILITIES_KINGSTON_REQUIRED_GROUPS = ["treatment", "distribution"];
export const UTILITIES_KINGSTON_SCRIPT_VERSION = "1.0.0";
/** Immutable digest of the owner-approved private plan. */
export const UTILITIES_KINGSTON_APPROVED_PLAN_DIGEST = "7d94529b23b9f660e936f1ab0073b7aaf2d8269cc9e2a160c1f7de6826289143";

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function stableJson(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("Recovery canonicalization received an invalid date.");
    return JSON.stringify(value.toISOString());
  }
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function normalizeManagerEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 320) {
    throw new Error("Recovery plan contains an invalid manager email.");
  }
  return email;
}

function daysInUtcMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Historical annual terms use the same calendar date in the following year.
 * A February 29 purchase ends February 28 in a non-leap following year.
 */
export function deriveOneYearTerm(paymentCreatedAt) {
  if (!(paymentCreatedAt instanceof Date) && typeof paymentCreatedAt !== "string") {
    throw new Error("Recovery payment timestamp must be an ISO timestamp or Date.");
  }
  if (typeof paymentCreatedAt === "string" && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(paymentCreatedAt)) {
    throw new Error("Recovery payment timestamp must use an ISO UTC timestamp.");
  }
  if (paymentCreatedAt instanceof Date && Number.isNaN(paymentCreatedAt.getTime())) {
    throw new Error("Recovery payment timestamp is invalid.");
  }
  const normalizedTimestamp = paymentCreatedAt instanceof Date
    ? paymentCreatedAt.toISOString()
    : paymentCreatedAt;
  const startsAt = new Date(normalizedTimestamp);

  const nextYear = startsAt.getUTCFullYear() + 1;
  const month = startsAt.getUTCMonth();
  const day = Math.min(startsAt.getUTCDate(), daysInUtcMonth(nextYear, month));
  const endsAt = new Date(Date.UTC(
    nextYear,
    month,
    day,
    startsAt.getUTCHours(),
    startsAt.getUTCMinutes(),
    startsAt.getUTCSeconds(),
    startsAt.getUTCMilliseconds(),
  ));

  if (endsAt.getTime() <= startsAt.getTime()) throw new Error("Recovery annual term did not advance.");
  return { startsAt, endsAt };
}

export function recoveryExternalReference(recoveryKey, group) {
  if (recoveryKey !== UTILITIES_KINGSTON_RECOVERY_KEY) {
    throw new Error("Recovery key is not approved for external reference generation.");
  }
  if (!UTILITIES_KINGSTON_REQUIRED_GROUPS.includes(group)) {
    throw new Error("Recovery group is unsupported.");
  }
  return `recovery:${recoveryKey}:${group}`;
}

export function validateUtilitiesKingstonPlan(rawPlan) {
  if (!rawPlan || typeof rawPlan !== "object") throw new Error("Recovery plan is required.");
  if (rawPlan.recoveryKey !== UTILITIES_KINGSTON_RECOVERY_KEY) {
    throw new Error("Recovery plan key is not recognized.");
  }
  if (rawPlan.version !== 1) throw new Error("Recovery plan version is not recognized.");
  if (typeof rawPlan.authorizationRef !== "string" || rawPlan.authorizationRef.trim().length < 24) {
    throw new Error("Recovery plan is missing a durable authorization reference.");
  }
  if (!rawPlan.sourceArchive || typeof rawPlan.sourceArchive.path !== "string" || !/^[a-f0-9]{64}$/i.test(rawPlan.sourceArchive.sha256 ?? "")) {
    throw new Error("Recovery plan must bind a verified private source archive.");
  }
  if (!Array.isArray(rawPlan.groups) || rawPlan.groups.length !== 2) {
    throw new Error("Recovery plan must contain exactly two manager groups.");
  }

  const groups = rawPlan.groups.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Recovery group entry is invalid.");
    if (!UTILITIES_KINGSTON_REQUIRED_GROUPS.includes(item.group)) throw new Error("Recovery group is invalid.");
    if (!Number.isInteger(item.seatCount) || item.seatCount < 1 || item.seatCount > 500) {
      throw new Error("Recovery group seat count is invalid.");
    }
    if (typeof item.sourceEvidenceKey !== "string" || item.sourceEvidenceKey.length < 12) {
      throw new Error("Recovery group is missing its protected evidence key.");
    }
    const managerEmail = normalizeManagerEmail(item.managerEmail);
    if (!/^[a-f0-9]{64}$/i.test(item.managerIdentitySha256 ?? "")) {
      throw new Error("Recovery group is missing its verified manager identity binding.");
    }
    if (!/^[a-f0-9]{64}$/i.test(item.paymentIdentitySha256 ?? "")) {
      throw new Error("Recovery group is missing its verified payment identity binding.");
    }
    if (typeof item.organizationName !== "string" || item.organizationName.trim().length < 4 || item.organizationName.length > 200) {
      throw new Error("Recovery group organization name is invalid.");
    }
    return {
      group: item.group,
      seatCount: item.seatCount,
      sourceEvidenceKey: item.sourceEvidenceKey,
      managerEmail,
      managerIdentitySha256: item.managerIdentitySha256.toLowerCase(),
      paymentIdentitySha256: item.paymentIdentitySha256.toLowerCase(),
      organizationName: item.organizationName.trim(),
    };
  }).sort((a, b) => a.group.localeCompare(b.group));

  const groupsByName = new Map(groups.map((group) => [group.group, group]));
  if (groupsByName.size !== 2 || !groupsByName.has("distribution") || !groupsByName.has("treatment")) {
    throw new Error("Recovery plan must include one Treatment and one Distribution group.");
  }
  if (groupsByName.get("distribution").seatCount !== 10 || groupsByName.get("treatment").seatCount !== 14) {
    throw new Error("Recovery plan does not match the approved 14/10 seat allocation.");
  }
  if (new Set(groups.map((item) => item.sourceEvidenceKey)).size !== 2) {
    throw new Error("Recovery plan cannot reuse an evidence key.");
  }
  if (new Set(groups.map((item) => item.managerIdentitySha256)).size !== 2) {
    throw new Error("Recovery plan cannot reuse a manager identity binding.");
  }
  if (new Set(groups.map((item) => item.managerEmail)).size !== 2) {
    throw new Error("Recovery plan requires two distinct manager contacts.");
  }
  if (new Set(groups.map((item) => item.paymentIdentitySha256)).size !== 2) {
    throw new Error("Recovery plan requires two distinct payment identity bindings.");
  }
  if (new Set(groups.map((item) => item.organizationName.toLowerCase())).size !== 2) {
    throw new Error("Recovery plan requires separate dashboard organization names.");
  }

  return {
    version: 1,
    recoveryKey: rawPlan.recoveryKey,
    authorizationRef: rawPlan.authorizationRef.trim(),
    sourceArchive: {
      path: rawPlan.sourceArchive.path,
      sha256: rawPlan.sourceArchive.sha256.toLowerCase(),
    },
    groups,
  };
}

export function recoveryPlanDigest(plan) {
  const validated = validateUtilitiesKingstonPlan(plan);
  return sha256(stableJson({
    ...validated,
    sourceArchive: { sha256: validated.sourceArchive.sha256 },
  }));
}

export function assertApprovedUtilitiesKingstonPlan(plan) {
  const digest = recoveryPlanDigest(plan);
  if (digest !== UTILITIES_KINGSTON_APPROVED_PLAN_DIGEST) {
    throw new Error("Recovery plan does not match the owner-approved Utilities Kingston authorization.");
  }
  return validateUtilitiesKingstonPlan(plan);
}

export function confirmationTokenForPlan(plan) {
  return `APPLY_UTILITIES_KINGSTON_${recoveryPlanDigest(plan).slice(0, 24).toUpperCase()}`;
}

export function safeRecoverySummary(plan, evidenceRows) {
  const validated = assertRecoveryEvidenceRows(plan, evidenceRows);
  const evidenceByKey = new Map(evidenceRows.map((row) => [row.sourceEvidenceKey, row]));
  const groups = validated.groups.map((group) => {
    const evidence = evidenceByKey.get(group.sourceEvidenceKey);
    if (!evidence) throw new Error("Recovery evidence is missing for an approved group.");
    const { startsAt, endsAt } = deriveOneYearTerm(evidence.paymentCreatedAt);
    return {
      group: group.group,
      seatCount: group.seatCount,
      termStart: startsAt.toISOString(),
      termEnd: endsAt.toISOString(),
      dashboardSeparated: true,
    };
  });
  return {
    recoveryKey: validated.recoveryKey,
    planDigest: recoveryPlanDigest(validated),
    groups,
    expectedChanges: {
      organizations: 2,
      managerMemberships: 2,
      operatorMemberships: 0,
      subscriptions: 0,
      teamFlexLicences: 0,
      purchases: 0,
      users: 0,
      outboundEmails: 0,
      stripeRequests: 0,
    },
  };
}

export function assertRecoveryEvidenceRows(plan, evidenceRows) {
  const validated = validateUtilitiesKingstonPlan(plan);
  if (!Array.isArray(evidenceRows) || evidenceRows.length !== 2) {
    throw new Error("Recovery requires exactly two locked evidence rows.");
  }
  const evidenceByKey = new Map(evidenceRows.map((row) => [row.sourceEvidenceKey, row]));
  if (evidenceByKey.size !== 2) throw new Error("Recovery evidence keys are not unique.");
  for (const group of validated.groups) {
    const evidence = evidenceByKey.get(group.sourceEvidenceKey);
    if (!evidence) throw new Error("An approved recovery evidence row is unavailable.");
    if (evidence.paymentStatus !== "succeeded") throw new Error("Recovery requires successful historical payments.");
    if (evidence.importedAt !== null && evidence.importedAt !== undefined) throw new Error("Recovery evidence was already imported.");
    if (evidence.reviewStatus !== "approved") throw new Error("Recovery evidence requires explicit approval before import.");
    if (evidence.recoverySubjectType !== "organization_manager") throw new Error("Recovery evidence is not organization-manager evidence.");
    if (!Number.isInteger(evidence.recoverySeatCount) || evidence.recoverySeatCount !== group.seatCount) throw new Error("Recovery seat evidence does not match the approved allocation.");
    if (!evidence.normalizedEmail || !evidence.paymentCreatedAt) throw new Error("Recovery evidence lacks a payment identity or timestamp.");
    if (sha256(normalizeManagerEmail(evidence.normalizedEmail)) !== group.paymentIdentitySha256) {
      throw new Error("Recovery payment identity does not match the approved evidence binding.");
    }
    if (evidence.recoveryOrganizationGroup !== group.group) {
      throw new Error("Recovery evidence conflicts with the approved group mapping.");
    }
    if (sha256(group.managerEmail) !== group.managerIdentitySha256) {
      throw new Error("Recovery manager identity does not match the approved group binding.");
    }
  }
  return validated;
}
