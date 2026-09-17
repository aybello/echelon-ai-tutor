import assert from "node:assert/strict";
import test from "node:test";
import { digest } from "./stageLegacyQuestionArchive.mjs";
import {
  buildReleaseMetadata,
  buildReleasePlan,
  RELEASE_KEY,
} from "./releaseLegacyQuestionBanks.mjs";

const BANKS = ["bank-a", "bank-b"];
const COUNTS = { "bank-a": 2, "bank-b": 1 };

function row(bankKey, questionNum) {
  return {
    bankKey,
    questionNum,
    module: bankKey === "bank-a" ? (questionNum === 1 ? "Operations" : "Safety") : "Laboratory",
    difficulty: "medium",
    question: `Question ${bankKey}-${questionNum}`,
    options: JSON.stringify(["A", "B", "C", "D"]),
    correctIndex: 1,
    explanation: `Explanation ${bankKey}-${questionNum}`,
    steps: null,
    tip: null,
    isCalc: "no",
    topic: null,
    cognitiveLevel: null,
    sourceTitle: null,
    sourceReference: null,
    sourceUrl: null,
    blueprintObjective: null,
    reviewStatus: "in_review",
    reviewedBy: null,
    reviewedAt: null,
  };
}
function fixture() {
  const rows = [row("bank-a", 1), row("bank-a", 2), row("bank-b", 1)];
  const metadata = buildReleaseMetadata(rows, BANKS);
  return {
    rows,
    metadata,
    packageInfo: {
      archiveSha256: "a".repeat(64),
      sourceQuestionChecksum: digest(rows),
      bankCount: 2,
      questionCount: 3,
      rows,
      metadata,
    },
    expectations: { bankKeys: BANKS, bankCounts: COUNTS, questionCount: 3 },
  };
}

test("plans a strictly quarantined, count-pinned public release", () => {
  const { rows, packageInfo, expectations } = fixture();
  const plan = buildReleasePlan(rows, [], packageInfo, expectations);
  assert.equal(plan.status, "ready");
  assert.equal(plan.releaseKey, RELEASE_KEY);
  assert.match(plan.confirmationDigest, /^[a-f0-9]{64}$/);
  assert.equal(plan.expectedMetadata.length, 2);
  assert.deepEqual(JSON.parse(plan.expectedMetadata[0].modules), ["Operations", "Safety"]);
  assert.equal(plan.expectedMetadata[0].moduleTargets, null);
  assert.equal(plan.expectedMetadata[0].formulaLinks, null);
  assert.equal(plan.expectedMetadata[0].totalQuestions, 2);
});

test("recognizes only the exact completed release as idempotent", () => {
  const { rows, metadata, packageInfo, expectations } = fixture();
  const visibleRows = rows.map((item) => ({ ...item, reviewStatus: "unreviewed" }));
  const plan = buildReleasePlan(visibleRows, metadata, packageInfo, expectations);
  assert.equal(plan.status, "already_released");
});

test("fails closed when a quarantined row has drifted", () => {
  const { rows, packageInfo, expectations } = fixture();
  const changed = rows.map((item) => ({ ...item }));
  changed[0].question = "Unexpected change";
  assert.throws(
    () => buildReleasePlan(changed, [], packageInfo, expectations),
    /checksum differs/,
  );
});

test("fails closed if any bank is incomplete or release metadata pre-exists", () => {
  const { rows, metadata, packageInfo, expectations } = fixture();
  assert.throws(
    () => buildReleasePlan(rows.slice(0, 2), [], packageInfo, expectations),
    /current quarantined rows are/,
  );
  assert.throws(
    () => buildReleasePlan(rows, metadata, packageInfo, expectations),
    /metadata already exists/,
  );
});
