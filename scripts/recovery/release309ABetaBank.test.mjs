import assert from "node:assert/strict";
import test from "node:test";
import {
  BANK_KEY,
  buildReleasePlan,
  ELECTRICIAN_309A_BLUEPRINT_VERSION,
  ELECTRICIAN_309A_PROGRAM_KEY,
  EXPECTED_ITEM_COUNT,
} from "./release309ABetaBank.mjs";

function expectedFixture() {
  const expectedByNumber = new Map();
  for (let itemNumber = 1; itemNumber <= EXPECTED_ITEM_COUNT; itemNumber += 1) {
    expectedByNumber.set(itemNumber, `hash-${itemNumber}`);
  }
  return {
    allocationChecksum: "allocation-checksum",
    sourceManifestChecksum: "source-manifest-checksum",
    manifestChecksum: "complete-manifest-checksum",
    expectedByNumber,
    sourceManifest: { sources: [{ id: "official-source-a" }, { id: "official-source-b" }] },
  };
}
function stateFixture({ released = false } = {}) {
  return {
    bank: {
      id: 1,
      programKey: ELECTRICIAN_309A_PROGRAM_KEY,
      bankKey: BANK_KEY,
      versionKey: "309a-current-rsos-v3",
      blueprintVersion: ELECTRICIAN_309A_BLUEPRINT_VERSION,
      itemTarget: EXPECTED_ITEM_COUNT,
      allocationChecksum: "allocation-checksum",
      sourceManifestChecksum: "source-manifest-checksum",
      releaseChannel: released ? "beta" : "internal",
      active: released ? 1 : 0,
      commercialEligibility: 0,
      teamEligibility: 0,
    },
    questions: Array.from({ length: EXPECTED_ITEM_COUNT }, (_, index) => ({
      id: index + 1,
      bankItemNumber: index + 1,
      contentHash: `hash-${index + 1}`,
      contentStatus: released ? "beta_approved" : "draft",
      publicEligibility: released ? 1 : 0,
      authorIdentity: "echelon-author",
      sourceKey: index % 2 ? "official-source-a" : "official-source-b",
      rightsBasis: "public_official_reference",
    })),
    existingReleaseReviewCount: 0,
  };
}

test("plans only the exact source-governed 500-question free-beta release", () => {
  const plan = buildReleasePlan(stateFixture(), expectedFixture());
  assert.equal(plan.status, "ready");
  assert.match(plan.confirmationDigest, /^[a-f0-9]{64}$/);
});

test("recognizes only the exact completed beta release as idempotent", () => {
  const plan = buildReleasePlan(stateFixture({ released: true }), expectedFixture());
  assert.equal(plan.status, "already_released");
});

test("fails closed on content drift or commercial eligibility", () => {
  const sourceDrift = stateFixture();
  sourceDrift.questions[41].contentHash = "wrong-content";
  assert.throws(() => buildReleasePlan(sourceDrift, expectedFixture()), /does not match/);

  const commercialDrift = stateFixture();
  commercialDrift.bank.commercialEligibility = 1;
  assert.throws(() => buildReleasePlan(commercialDrift, expectedFixture()), /non-commercial/);
});

test("fails closed if beta review records already exist before an incomplete release", () => {
  const state = stateFixture();
  state.existingReleaseReviewCount = 1;
  assert.throws(() => buildReleasePlan(state, expectedFixture()), /review records already exist/);
});
