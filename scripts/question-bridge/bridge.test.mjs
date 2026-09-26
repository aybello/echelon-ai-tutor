import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rootCertificates } from "node:tls";
import {
  allowedBanks,
  connectionOptions,
  createQuestionBridge,
} from "./bridge.mjs";

test("each question query is scoped to an allowed bank and uses parameters", async () => {
  const calls = [];
  const pool = {
    async execute(sql, params) {
      calls.push({ sql, params });
      if (sql.includes("question_bank_meta"))
        return [[{ modules: '["A"]', moduleTargets: null, totalQuestions: 1 }]];
      if (sql.includes("GROUP BY"))
        return [[{ module: "A", reviewStatus: "unreviewed", count: 1 }]];
      return [[{ questionNum: 7, options: '["A","B"]', steps: null }]];
    },
  };
  const bridge = createQuestionBridge(pool, ["class3-water-dist"]);
  assert.equal((await bridge.summary("class3-water-dist")).actualCount, 1);
  assert.deepEqual(
    (await bridge.list("class3-water-dist", 5, 1)).questions[0].options,
    ["A", "B"]
  );
  assert.equal((await bridge.get("class3-water-dist", 7)).questionNum, 7);
  assert.equal(calls.length, 4);
  assert.ok(
    calls.every(
      ({ sql, params }) =>
        sql.startsWith("SELECT ") && params[0] === "class3-water-dist"
    )
  );
  assert.deepEqual(calls[2].params, ["class3-water-dist", 5, 1]);
  assert.deepEqual(calls[3].params, ["class3-water-dist", 7]);
  await assert.rejects(bridge.list("other", 0, 10), /not allowed/);
  await assert.rejects(bridge.list("class3-water-dist", 0, 101), /limit/);
  assert.equal(calls.length, 4);
});

test("connection enforces a dedicated DigitalOcean account and verified TLS", async () => {
  const dir = await mkdtemp(join(tmpdir(), "echelon-bridge-"));
  try {
    const caFile = join(dir, "ca.pem");
    await writeFile(
      caFile,
      rootCertificates.find(pem => pem.includes("BEGIN CERTIFICATE"))
    );
    const env = {
      ECHELON_DB_CA_FILE: caFile,
      ECHELON_REVIEW_DATABASE_URL:
        "mysql://reviewer:secret@db.example.db.ondigitalocean.com:25060/exams",
    };
    const config = await connectionOptions(env);
    assert.equal(config.ssl.rejectUnauthorized, true);
    assert.equal(config.ssl.verifyIdentity, true);
    assert.equal(config.user, "reviewer");
    await assert.rejects(
      connectionOptions({
        ...env,
        ECHELON_REVIEW_DATABASE_URL: env.ECHELON_REVIEW_DATABASE_URL.replace(
          "reviewer",
          "doadmin"
        ),
      }),
      /dedicated SELECT-only/
    );
    await assert.rejects(
      connectionOptions({
        ...env,
        ECHELON_REVIEW_DATABASE_URL: env.ECHELON_REVIEW_DATABASE_URL.replace(
          ".db.ondigitalocean.com",
          ".example.com"
        ),
      }),
      /DigitalOcean/
    );
    assert.deepEqual(
      allowedBanks({
        ECHELON_ALLOWED_BANKS: "class3-water-dist,wpi-class3-water-dist",
      }),
      ["class3-water-dist", "wpi-class3-water-dist"]
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
