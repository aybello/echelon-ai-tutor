-- Durable audit records for explicitly approved, one-time organization recovery.
-- Additive only. This migration does not create organizations, memberships,
-- seats, subscriptions, purchases, users, entitlements, messages, or Stripe work.
CREATE TABLE IF NOT EXISTS `customer_recovery_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recoveryKey` varchar(191) NOT NULL,
  `planDigest` varchar(64) NOT NULL,
  `archiveSha256` varchar(64) NOT NULL,
  `authorizationRef` varchar(255) NOT NULL,
  `confirmationTokenSha256` varchar(64) NOT NULL,
  `scriptVersion` varchar(32) NOT NULL,
  `beforeSnapshotSha256` varchar(64) NOT NULL,
  `outputDigest` varchar(64) NULL,
  `appliedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_recovery_batches_key_unique` (`recoveryKey`),
  UNIQUE KEY `customer_recovery_batches_plan_unique` (`planDigest`)
);

CREATE TABLE IF NOT EXISTS `customer_recovery_import_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batchId` int NOT NULL,
  `evidenceId` int NOT NULL,
  `organizationId` int NOT NULL,
  `managerMemberId` int NOT NULL,
  `recoveryGroup` enum('treatment','distribution') NOT NULL,
  `seatCount` int NOT NULL,
  `termStart` timestamp NOT NULL,
  `termEnd` timestamp NOT NULL,
  `externalReference` varchar(191) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_recovery_import_items_evidence_unique` (`evidenceId`),
  UNIQUE KEY `customer_recovery_import_items_organization_unique` (`organizationId`),
  UNIQUE KEY `customer_recovery_import_items_manager_unique` (`managerMemberId`),
  UNIQUE KEY `customer_recovery_import_items_reference_unique` (`externalReference`),
  KEY `customer_recovery_import_items_batch_idx` (`batchId`)
);
