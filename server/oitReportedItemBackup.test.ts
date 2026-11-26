import { chmod, lstat, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeDurableOitRepairBackup } from "../scripts/lib/oitReportedItemBackup.mjs";

const temporaryDirectories: string[] = [];

async function temporaryRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "echelon-oit-backup-"));
  await chmod(root, 0o700);
  temporaryDirectories.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

describe("reported OIT repair private backup", () => {
  it("creates an exclusive durable private JSON backup within the managed root", async () => {
    const root = await temporaryRoot();
    const backupFile = path.join(root, "oit-repair-20260921.json");
    const output = await writeDurableOitRepairBackup({
      backupRoot: root,
      backupFile,
      payload: { repairVersion: "test", rows: [{ id: 1 }] },
    });

    expect(output).toBe(backupFile);
    expect(JSON.parse(await readFile(backupFile, "utf8"))).toEqual({ repairVersion: "test", rows: [{ id: 1 }] });
    const stat = await lstat(backupFile);
    expect(stat.isSymbolicLink()).toBe(false);
    expect(stat.mode & 0o077).toBe(0);
    await expect(writeDurableOitRepairBackup({ backupRoot: root, backupFile, payload: {} })).rejects.toThrow();
  });

  it("refuses a backup file outside the managed root", async () => {
    const root = await temporaryRoot();
    await expect(writeDurableOitRepairBackup({
      backupRoot: root,
      backupFile: path.join(os.tmpdir(), "outside.json"),
      payload: {},
    })).rejects.toThrow(/direct file within the managed private backup root/);
  });

  it("refuses an existing symlink at the requested backup filename", async () => {
    const root = await temporaryRoot();
    const target = path.join(root, "target.json");
    const backupFile = path.join(root, "repair.json");
    await symlink(target, backupFile);
    await expect(writeDurableOitRepairBackup({ backupRoot: root, backupFile, payload: {} })).rejects.toThrow();
  });

  it("refuses a symlinked managed root", async () => {
    const parent = await temporaryRoot();
    const actualRoot = await temporaryRoot();
    const linkedRoot = path.join(parent, "linked-root");
    await symlink(actualRoot, linkedRoot);
    await expect(writeDurableOitRepairBackup({
      backupRoot: linkedRoot,
      backupFile: path.join(linkedRoot, "repair.json"),
      payload: {},
    })).rejects.toThrow(/not a symlink/);
  });
});
