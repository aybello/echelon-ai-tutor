#!/usr/bin/env node
import { BridgeInputError, openBridge } from "./bridge.mjs";

const usage = `Usage: pnpm question-bridge <doctor|summary|list|get|export> [options]
  --bank KEY       Allowed bank (default: class3-water-dist)
  --number N       Question number (get only)
  --after N        Continue after this question number (list only)
  --limit N        1–100 questions (list only; default: 50)

export writes all allowed-bank questions as JSON to stdout. Redirect to a private file.`;

function flags(args) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (
      !["--bank", "--number", "--after", "--limit"].includes(key) ||
      !args[i + 1] ||
      Object.hasOwn(result, key)
    )
      throw new BridgeInputError(usage);
    result[key] = args[i + 1];
  }
  return result;
}

function integer(value, fallback) {
  if (value === undefined) return fallback;
  if (!/^(0|[1-9]\d*)$/.test(value))
    throw new BridgeInputError("Numeric options must be nonnegative integers.");
  return Number(value);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "help") {
    process.stdout.write(`${usage}\n`);
    return;
  }
  const f = flags(args);
  if (!["doctor", "summary", "list", "get", "export"].includes(command))
    throw new BridgeInputError(usage);
  const valid = {
    doctor: [],
    summary: ["--bank"],
    list: ["--bank", "--after", "--limit"],
    get: ["--bank", "--number"],
    export: ["--bank"],
  };
  if (Object.keys(f).some(key => !valid[command].includes(key)))
    throw new BridgeInputError(usage);
  if (command === "get" && f["--number"] === undefined)
    throw new BridgeInputError("get requires --number.");
  const bridge = await openBridge();
  const bank = f["--bank"] || bridge.banks[0];
  try {
    if (command === "doctor") {
      const results = [];
      for (const allowed of bridge.banks) {
        const { actualCount, metadata } = await bridge.summary(allowed);
        results.push({
          bank: allowed,
          actualCount,
          metadataCount: metadata?.totalQuestions ?? null,
        });
      }
      process.stdout.write(
        `${JSON.stringify({ connected: true, banks: results }, null, 2)}\n`
      );
    } else if (command === "summary") {
      process.stdout.write(
        `${JSON.stringify(await bridge.summary(bank), null, 2)}\n`
      );
    } else if (command === "list") {
      const result = await bridge.list(
        bank,
        integer(f["--after"], 0),
        integer(f["--limit"], 50)
      );
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else if (command === "get") {
      process.stdout.write(
        `${JSON.stringify(await bridge.get(bank, integer(f["--number"])), null, 2)}\n`
      );
    } else {
      // Stream pages so a large bank does not need to be held in memory.
      let after = 0;
      let count = 0;
      process.stdout.write(
        '{"bank":' + JSON.stringify(bank) + ',"questions":['
      );
      while (true) {
        const page = await bridge.list(bank, after, 100);
        for (const question of page.questions) {
          process.stdout.write((count++ ? "," : "") + JSON.stringify(question));
        }
        if (!page.nextAfter) break;
        if (page.nextAfter <= after)
          throw new Error("Pagination did not advance.");
        after = page.nextAfter;
      }
      process.stdout.write(`],"count":${count}}\n`);
    }
  } finally {
    await bridge.close();
  }
}

main().catch(error => {
  // mysql2 failures may contain server and account details; never print raw DB errors.
  process.stderr.write(
    `${error instanceof BridgeInputError ? error.message : "Database connection or query failed."}\n`
  );
  process.exitCode = 1;
});
