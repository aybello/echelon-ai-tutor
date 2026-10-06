import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadPrivateRecipients } from "./privateRecipients.mjs";

test("requires explicit approval and rejects repo-contained or world-readable manifests", () => {
  const root = mkdtempSync(join(tmpdir(), "private-input-"));
  const repo = join(root, "repo"); mkdirSync(repo);
  const privatePath = join(root, "recipients.json");
  const args = { path: privatePath, repoRoot: repo, approval: "SEND_APPROVED_PRIVATE_RECIPIENTS" };
  try {
    writeFileSync(privatePath, JSON.stringify(["LEARNER@example.com", "learner@example.com"]), { mode: 0o600 });
    assert.throws(() => loadPrivateRecipients({ ...args, approval: undefined }), /approval/);
    assert.deepEqual(loadPrivateRecipients(args), ["learner@example.com"]);
    chmodSync(privatePath, 0o644);
    assert.throws(() => loadPrivateRecipients(args), /owner-only/);
    const inside = join(repo, "input.json"); writeFileSync(inside, "[]", { mode: 0o600 });
    assert.throws(() => loadPrivateRecipients({ ...args, path: inside }), /outside/);
    chmodSync(privatePath, 0o600);
    writeFileSync(privatePath, '{"email":"learner@example.com"}');
    assert.throws(() => loadPrivateRecipients(args), /bounded array/);
    writeFileSync(privatePath, "not json");
    assert.throws(() => loadPrivateRecipients(args), /Invalid private/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
