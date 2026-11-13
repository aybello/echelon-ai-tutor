import { readFileSync, realpathSync, statSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";

export function loadPrivateRecipients({ path, approval, repoRoot }) {
  if (approval !== "SEND_APPROVED_PRIVATE_RECIPIENTS" || !path) {
    throw new Error("Private recipient input and explicit outreach approval are required.");
  }
  const input = realpathSync(resolve(path));
  const root = realpathSync(resolve(repoRoot));
  const within = relative(root, input);
  if (!within || (!within.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(within))) {
    throw new Error("Recipient input must be stored outside the repository.");
  }
  const info = statSync(input);
  if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > 1_000_000) {
    throw new Error("Recipient input must be a bounded private file with owner-only permissions.");
  }
  let parsed;
  try { parsed = JSON.parse(readFileSync(input, "utf8")); }
  catch { throw new Error("Invalid private recipient manifest."); }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 1000 || parsed.some(value => typeof value !== "string" || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value))) {
    throw new Error("Recipient manifest must contain a bounded array of email addresses.");
  }
  return [...new Set(parsed.map(value => value.trim().toLowerCase()))];
}
