import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const packageJsonPath = resolve(rootDir, "package.json");
const workspacePath = resolve(rootDir, "pnpm-workspace.yaml");
const lockfilePath = resolve(rootDir, "pnpm-lock.yaml");
const expectedOverrides = {
  "tailwindcss>nanoid": "3.3.7",
  "ip-address": "10.3.1",
  lodash: "4.18.0",
  "lodash-es": "4.18.0",
  "mdast-util-to-hast": "13.2.1",
  "path-to-regexp": "0.1.13",
  qs: "6.16.0",
};
const expectedPatch = {
  "wouter@3.7.1": "patches/wouter@3.7.1.patch",
};

function fail(message) {
  console.error(`[dependency guardrails] ${message}`);
  process.exit(1);
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function workspaceDeclares(name, value) {
  const workspace = readFileSync(workspacePath, "utf8");
  const pattern = new RegExp(
    `^\\s*["']?${escaped(name)}["']?:\\s*["']?${escaped(value)}["']?\\s*$`,
    "m"
  );
  return pattern.test(workspace);
}

if (!existsSync(workspacePath)) {
  fail("pnpm-workspace.yaml is missing.");
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
if (packageJson.pnpm !== undefined) {
  fail("deprecated package.json pnpm settings are still present.");
}

for (const [name, version] of Object.entries(expectedOverrides)) {
  if (!workspaceDeclares(name, version)) {
    fail(`workspace override ${name}@${version} is missing.`);
  }
}

for (const [name, patchPath] of Object.entries(expectedPatch)) {
  if (!workspaceDeclares(name, patchPath)) {
    fail(`workspace patch ${name} at ${patchPath} is missing.`);
  }
}

const lockfile = readFileSync(lockfilePath, "utf8");
if (!lockfile.includes("nodemailer@9.1.1:")) {
  fail("pnpm-lock.yaml does not resolve Nodemailer 9.1.1.");
}
if (!lockfile.includes("wouter@3.7.1(patch_hash=")) {
  fail("pnpm-lock.yaml does not record the Wouter patch.");
}
const installedWouterPath = resolve(
  rootDir,
  "node_modules/wouter/esm/index.js"
);
if (
  !existsSync(installedWouterPath) ||
  !readFileSync(installedWouterPath, "utf8").includes("__WOUTER_ROUTES__")
) {
  fail(
    "the installed Wouter artifact does not contain the required route-discovery patch."
  );
}

console.log(
  "Dependency guardrails are active: approved workspace overrides, installed Wouter patch, and Nodemailer 9.1.1."
);
