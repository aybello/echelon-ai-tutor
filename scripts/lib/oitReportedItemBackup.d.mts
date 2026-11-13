export const DEFAULT_OIT_REPAIR_BACKUP_ROOT: string;
export function writeDurableOitRepairBackup(input: {
  backupFile: string;
  backupRoot?: string;
  payload: unknown;
}): Promise<string>;
