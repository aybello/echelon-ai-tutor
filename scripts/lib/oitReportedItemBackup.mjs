import { constants } from "node:fs";
import { lstat, mkdir, open, realpath } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_OIT_REPAIR_BACKUP_ROOT = "/home/ubuntu/private/echelon-authoritative-recovery/oit-content-repair-backups";

async function assertTrustedBackupRoot(backupRoot) {
  await mkdir(backupRoot, { recursive: true, mode: 0o700 });
  const rootStat = await lstat(backupRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error("OIT repair backup root must be a real directory, not a symlink.");
  }
  if ((rootStat.mode & 0o077) !== 0) {
    throw new Error("OIT repair backup root must not be group- or world-accessible.");
  }
  if (typeof process.getuid === "function" && rootStat.uid !== process.getuid()) {
    throw new Error("OIT repair backup root must be owned by the current user.");
  }
  return realpath(backupRoot);
}

export async function writeDurableOitRepairBackup({ backupFile, payload, backupRoot = DEFAULT_OIT_REPAIR_BACKUP_ROOT }) {
  const root = await assertTrustedBackupRoot(backupRoot);
  const requestedDirectory = await realpath(path.resolve(path.dirname(backupFile)));
  const filename = path.basename(backupFile);
  if (requestedDirectory !== root || path.dirname(path.resolve(backupFile)) !== root) {
    throw new Error("OIT repair backup must be a direct file within the managed private backup root.");
  }
  if (!/^[a-z0-9][a-z0-9._-]*\.json$/i.test(filename)) {
    throw new Error("OIT repair backup filename must be a simple .json filename.");
  }
  const resolvedFile = path.join(root, filename);

  const rootDirectory = await open(root, constants.O_RDONLY | constants.O_DIRECTORY);
  try {
    const file = await open(
      resolvedFile,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600,
    );
    try {
      await file.writeFile(`${JSON.stringify(payload, null, 2)}\n`);
      await file.sync();
    } finally {
      await file.close();
    }
    await rootDirectory.sync();
  } finally {
    await rootDirectory.close();
  }
  return resolvedFile;
}
