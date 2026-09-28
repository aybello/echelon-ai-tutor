import { readFile } from "node:fs/promises";
import { X509Certificate } from "node:crypto";
import mysql from "mysql2/promise";

const DEFAULT_BANK = "class3-water-dist";
const QUESTION_COLUMNS = [
  "id",
  "bankKey",
  "questionNum",
  "module",
  "difficulty",
  "question",
  "options",
  "correctIndex",
  "explanation",
  "steps",
  "tip",
  "isCalc",
  "topic",
  "cognitiveLevel",
  "sourceTitle",
  "sourceReference",
  "sourceUrl",
  "blueprintObjective",
  "reviewStatus",
  "reviewedBy",
  "reviewedAt",
];
const SELECT_QUESTION = QUESTION_COLUMNS.map(column => `\`${column}\``).join(
  ", "
);
export class BridgeInputError extends Error {}

export function allowedBanks(env = process.env) {
  const banks = (env.ECHELON_ALLOWED_BANKS || DEFAULT_BANK)
    .split(",")
    .map(bank => bank.trim());
  if (
    !banks.length ||
    banks.some(bank => !/^[a-z0-9][a-z0-9-]{0,63}$/.test(bank))
  ) {
    throw new BridgeInputError(
      "ECHELON_ALLOWED_BANKS must contain comma-separated bank keys."
    );
  }
  return [...new Set(banks)];
}

export function checkBank(bank, banks) {
  if (!banks.includes(bank))
    throw new BridgeInputError("Bank is not allowed by ECHELON_ALLOWED_BANKS.");
  return bank;
}

export function checkInteger(value, label, max = 2_147_483_647) {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new BridgeInputError(`${label} must be an integer from 1 to ${max}.`);
  }
  return value;
}

export async function connectionOptions(env = process.env) {
  if (!env.ECHELON_REVIEW_DATABASE_URL || !env.ECHELON_DB_CA_FILE) {
    throw new BridgeInputError(
      "Set ECHELON_REVIEW_DATABASE_URL and ECHELON_DB_CA_FILE."
    );
  }
  let url;
  try {
    url = new URL(env.ECHELON_REVIEW_DATABASE_URL);
    if (
      url.protocol !== "mysql:" ||
      !url.hostname ||
      !url.username ||
      !url.password ||
      url.pathname.length < 2 ||
      url.hash ||
      [...url.searchParams.keys()].some(
        key => key !== "ssl-mode" && key !== "ssl"
      ) ||
      (url.searchParams.has("ssl") && url.searchParams.has("ssl-mode")) ||
      [...url.searchParams.values()].some(
        value =>
          !["REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY", "true"].includes(value)
      )
    )
      throw new Error("invalid");
  } catch {
    throw new BridgeInputError("ECHELON_REVIEW_DATABASE_URL is invalid.");
  }
  if (!url.hostname.endsWith(".db.ondigitalocean.com")) {
    throw new BridgeInputError(
      "The review database host must be a DigitalOcean Managed Database host."
    );
  }
  const user = decodeURIComponent(url.username);
  if (user.toLowerCase() === "doadmin") {
    throw new BridgeInputError(
      "Use a dedicated SELECT-only account instead of doadmin."
    );
  }
  const port = url.port ? Number(url.port) : 25060;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new BridgeInputError(
      "ECHELON_REVIEW_DATABASE_URL has an invalid port."
    );
  }
  let certificate;
  try {
    const ca = await readFile(env.ECHELON_DB_CA_FILE, "utf8");
    certificate = new X509Certificate(ca);
    if (
      Date.now() < Date.parse(certificate.validFrom) ||
      Date.now() > Date.parse(certificate.validTo)
    ) {
      throw new Error("expired");
    }
    return {
      host: url.hostname,
      port,
      user,
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      charset: "utf8mb4",
      timezone: "Z",
      connectTimeout: 10_000,
      connectionLimit: 2,
      waitForConnections: true,
      ssl: {
        ca,
        rejectUnauthorized: true,
        verifyIdentity: true,
        minVersion: "TLSv1.2",
      },
    };
  } catch {
    throw new BridgeInputError(
      "ECHELON_DB_CA_FILE must point to a current PEM CA certificate."
    );
  }
}

export async function openBridge(env = process.env) {
  const banks = allowedBanks(env);
  const pool = mysql.createPool(await connectionOptions(env));
  return {
    banks,
    pool,
    ...createQuestionBridge(pool, banks),
    close: () => pool.end(),
  };
}

function parseJson(value) {
  if (value == null || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function questionRow(row) {
  return {
    ...row,
    options: parseJson(row.options),
    steps: parseJson(row.steps),
  };
}

// The shared query layer accepts a mysql2 pool (or a test double). No caller supplies SQL.
export function createQuestionBridge(pool, banks) {
  return {
    async summary(bank = DEFAULT_BANK) {
      checkBank(bank, banks);
      const [metadata] = await pool.execute(
        "SELECT `bankKey`, `totalQuestions`, `contentVersion`, `blueprintVersion`, `modules`, `moduleTargets` FROM `question_bank_meta` WHERE `bankKey` = ? LIMIT 1",
        [bank]
      );
      const [counts] = await pool.execute(
        "SELECT `module`, `reviewStatus`, COUNT(*) AS `count` FROM `questions` WHERE `bankKey` = ? GROUP BY `module`, `reviewStatus` ORDER BY `module`, `reviewStatus`",
        [bank]
      );
      return {
        bank,
        metadata: metadata[0]
          ? {
              ...metadata[0],
              modules: parseJson(metadata[0].modules),
              moduleTargets: parseJson(metadata[0].moduleTargets),
            }
          : null,
        actualCount: counts.reduce((sum, row) => sum + Number(row.count), 0),
        counts: counts.map(row => ({ ...row, count: Number(row.count) })),
      };
    },
    async list(bank = DEFAULT_BANK, after = 0, limit = 50) {
      checkBank(bank, banks);
      if (!Number.isSafeInteger(after) || after < 0)
        throw new BridgeInputError("after must be a nonnegative integer.");
      checkInteger(limit, "limit", 100);
      const [rows] = await pool.execute(
        `SELECT ${SELECT_QUESTION} FROM \`questions\` WHERE \`bankKey\` = ? AND \`questionNum\` > ? ORDER BY \`questionNum\` LIMIT ?`,
        [bank, after, limit]
      );
      const questions = rows.map(questionRow);
      return {
        bank,
        questions,
        nextAfter:
          questions.length === limit ? questions.at(-1).questionNum : null,
      };
    },
    async get(bank = DEFAULT_BANK, number) {
      checkBank(bank, banks);
      checkInteger(number, "number");
      const [rows] = await pool.execute(
        `SELECT ${SELECT_QUESTION} FROM \`questions\` WHERE \`bankKey\` = ? AND \`questionNum\` = ? LIMIT 1`,
        [bank, number]
      );
      return rows[0] ? questionRow(rows[0]) : null;
    },
  };
}
