-- Hardens the unused recovery-audit tables before the first organization import.
-- Preconditions: no recovery batch or import item exists. This migration changes
-- only the additive audit tables introduced by 0070 and cannot affect live access.
ALTER TABLE `customer_recovery_batches`
  ADD COLUMN `backupArtifactPath` varchar(512) NOT NULL,
  ADD COLUMN `status` enum('applying','applied') NOT NULL;

ALTER TABLE `customer_recovery_import_items`
  MODIFY COLUMN `termStart` datetime NOT NULL,
  MODIFY COLUMN `termEnd` datetime NOT NULL;
