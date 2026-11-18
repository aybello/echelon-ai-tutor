import safety from "../../scripts/test-safety.cjs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { decodeTrustedLogos, prepareMedia } from "./prepare-media.mjs";

safety.assertPreloaded();
const fixtureUrl = new URL("./fixtures/trusted-logos.json", import.meta.url);
const fixtures = JSON.parse(await readFile(fixtureUrl, "utf8"));
const organizations = JSON.parse(await readFile(new URL("../../client/src/lib/trustedOrganizations.json", import.meta.url), "utf8"));
const sources = JSON.parse(await readFile(new URL("./media-sources.json", import.meta.url), "utf8"));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

test("all four authorized managed logo paths have byte-identical, small offline fixtures", async () => {
  assert.equal(fixtures.length, 4);
  assert.ok((await readFile(fixtureUrl)).length < 150_000);
  const logos = decodeTrustedLogos(fixtures, organizations);
  assert.deepEqual(logos.map(asset => asset.storagePath).sort(), organizations.map(asset => asset.runtimeUrl).sort());
  for (const [index, logo] of logos.entries()) {
    assert.equal(sha256(logo.bytes), fixtures[index].sha256);
    if (fixtures[index].extension === "png") {
      assert.equal(logo.bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    } else {
      assert.match(logo.bytes.toString("utf8"), /<svg\b/);
    }
  }
});

test("missing, duplicate, unregistered or drifted logo fixture paths fail closed", () => {
  assert.throws(() => decodeTrustedLogos(fixtures.slice(1), organizations), /cover every organization/);
  for (const replacement of [
    fixtures[1],
    { ...fixtures[0], storagePath: "/manus-storage/unregistered.png" },
    { ...fixtures[0], extension: "svg" },
    { ...fixtures[0], sha256: "0".repeat(64) },
  ]) {
    assert.throws(() => decodeTrustedLogos([replacement, ...fixtures.slice(1)], organizations), /approved client manifest/);
  }
});

test("non-authorized display flags cannot be used by the offline fixture", () => {
  for (const logoDisplayAllowed of [false, undefined, "true"]) {
    const changed = [{ ...organizations[0], logoDisplayAllowed }, ...organizations.slice(1)];
    assert.throws(() => decodeTrustedLogos(fixtures, changed), /approved client manifest/);
  }
});

test("corrupted bytes and non-canonical base64 are rejected", () => {
  for (const base64 of [Buffer.from("not the official logo").toString("base64"), `${fixtures[0].base64}\n`]) {
    assert.throws(() => decodeTrustedLogos([{ ...fixtures[0], base64 }, ...fixtures.slice(1)], organizations), /checksum mismatch/);
  }
});

test("offline preparation retains all 34 pinned CEU originals and registers all four logos", async () => {
  assert.equal(sources.length, 34);
  assert.ok(sources.every(asset => asset.sha === "7f6045098c044aea234b3788dd2df8c73f591172"));
  const output = await mkdtemp(path.join(tmpdir(), "echelon-preview-media-test-"));
  try {
    const manifest = await prepareMedia(output);
    assert.equal(manifest.length, 38);
    assert.equal(new Set(manifest.map(asset => asset.storagePath)).size, 38);
    assert.deepEqual(JSON.parse(await readFile(path.join(output, "assets.json"), "utf8")), manifest);
    for (const asset of [...sources, ...fixtures]) {
      const registered = manifest.find(item => item.storagePath === asset.storagePath);
      assert.ok(registered, "Every managed media path must be registered");
      assert.equal(path.dirname(registered.original), output);
      assert.equal(sha256(await readFile(registered.original)), asset.sha256);
    }
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
