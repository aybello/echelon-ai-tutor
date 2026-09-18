import assert from "node:assert/strict";
import test from "node:test";
import {
  APPROVED_CUTOVER_STATUS_URL,
  approvedCutoverStatusUrl,
  assertLiveCutoverWriteFence,
} from "../lib/cutoverStatus.mjs";

function responseFor(url, payload, { ok = true, cacheControl = "no-store" } = {}) {
  return {
    ok,
    url,
    headers: { get: name => name === "cache-control" ? cacheControl : null },
    async json() {
      return payload;
    },
  };
}

test("accepts two fresh challenge-bound confirmations from the approved production endpoint", async () => {
  const calls = [];
  const challenges = ["first-challenge", "second-challenge"];
  await assertLiveCutoverWriteFence(APPROVED_CUTOVER_STATUS_URL, {
    createChallenge: () => challenges.shift(),
    sleep: async () => {},
    fetchImpl: async (url, options) => {
      calls.push({ url: url.href, options });
      const challenge = url.searchParams.get("challenge");
      return responseFor(url.href, { writesFrozen: true, mode: "freeze", challenge });
    },
  });

  assert.equal(calls.length, 2);
  assert.notEqual(new URL(calls[0].url).searchParams.get("challenge"), new URL(calls[1].url).searchParams.get("challenge"));
  for (const call of calls) {
    assert.equal(call.options.cache, "no-store");
    assert.equal(call.options.redirect, "error");
  }
});

test("rejects anything except the exact approved production endpoint", () => {
  for (const value of [
    undefined,
    "http://echeloninstitute.ca/api/cutover/status",
    "https://www.echeloninstitute.ca/api/cutover/status",
    "https://echeloninstitute.ca:443/api/cutover/status",
    "https://echeloninstitute.ca/api/cutover/status?x=1",
    "https://echeloninstitute.ca/api/cutover/status/",
    "https://echeloninstitute.ca/api/cutover/status#fragment",
    "https://name:password@echeloninstitute.ca/api/cutover/status",
  ]) {
    assert.throws(() => approvedCutoverStatusUrl(value), /approved production cutover status endpoint|required/);
  }
});

test("rejects redirects, stale challenges, non-success responses, and malformed status payloads", async () => {
  const cases = [
    async (url) => responseFor("https://redirected.example/api/cutover/status", { writesFrozen: true, mode: "freeze", challenge: url.searchParams.get("challenge") }),
    async (url) => responseFor(url.href, { writesFrozen: true, mode: "freeze", challenge: "stale-challenge" }),
    async (url) => responseFor(url.href, { writesFrozen: true, mode: "freeze", challenge: url.searchParams.get("challenge") }, { ok: false }),
    async (url) => responseFor(url.href, { writesFrozen: true, mode: "freeze", challenge: url.searchParams.get("challenge") }, { cacheControl: "public, max-age=3600" }),
    async (url) => ({ ok: true, url: url.href, headers: { get: () => "no-store" }, async json() { throw new Error("not JSON"); } }),
  ];

  for (const fetchImpl of cases) {
    await assert.rejects(
      () => assertLiveCutoverWriteFence(APPROVED_CUTOVER_STATUS_URL, {
        fetchImpl,
        createChallenge: () => "current-challenge",
        sleep: async () => {},
      }),
      /cutover status endpoint|write freeze/
    );
  }
});
