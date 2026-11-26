-- Migration 0046: Teams webhook reliability reconciliation
-- This migration is safe for the existing Echelon database and a database
-- where the prior partial Teams webhook schema has already been applied.

SET @echelon_schema_name = DATABASE();
--> statement-breakpoint

SET @echelon_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `organizations` ADD COLUMN `onboardingEmailSentAt` timestamp NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @echelon_schema_name
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'onboardingEmailSentAt'
);
--> statement-breakpoint
PREPARE echelon_stmt FROM @echelon_sql;
--> statement-breakpoint
EXECUTE echelon_stmt;
--> statement-breakpoint
DEALLOCATE PREPARE echelon_stmt;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `stripe_event_log` (
  `id` int AUTO_INCREMENT NOT NULL,
  `stripeEventId` varchar(128) NOT NULL,
  `eventType` varchar(128) NOT NULL,
  `stripeObjectId` varchar(128),
  `orgId` int,
  `status` varchar(40) NOT NULL DEFAULT 'pending',
  `dbProcessed` boolean NOT NULL DEFAULT false,
  `emailDelivered` boolean NOT NULL DEFAULT false,
  `attemptCount` int NOT NULL DEFAULT 0,
  `processingToken` varchar(64),
  `processingStartedAt` timestamp NULL,
  `lastError` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` timestamp NULL,
  CONSTRAINT `stripe_event_log_id` PRIMARY KEY (`id`),
  CONSTRAINT `stripe_event_log_stripeEventId_unique` UNIQUE (`stripeEventId`),
  INDEX `stripe_event_log_event_type_idx` (`eventType`),
  INDEX `stripe_event_log_org_id_idx` (`orgId`),
  INDEX `stripe_event_log_status_idx` (`status`)
);
--> statement-breakpoint

SET @echelon_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `stripe_event_log` ADD COLUMN `processingToken` varchar(64) NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @echelon_schema_name
    AND TABLE_NAME = 'stripe_event_log'
    AND COLUMN_NAME = 'processingToken'
);
--> statement-breakpoint
PREPARE echelon_stmt FROM @echelon_sql;
--> statement-breakpoint
EXECUTE echelon_stmt;
--> statement-breakpoint
DEALLOCATE PREPARE echelon_stmt;
--> statement-breakpoint

SET @echelon_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `stripe_event_log` ADD COLUMN `processingStartedAt` timestamp NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @echelon_schema_name
    AND TABLE_NAME = 'stripe_event_log'
    AND COLUMN_NAME = 'processingStartedAt'
);
--> statement-breakpoint
PREPARE echelon_stmt FROM @echelon_sql;
--> statement-breakpoint
EXECUTE echelon_stmt;
--> statement-breakpoint
DEALLOCATE PREPARE echelon_stmt;
--> statement-breakpoint

ALTER TABLE `stripe_event_log`
  MODIFY COLUMN `status` varchar(40) NOT NULL DEFAULT 'pending';
--> statement-breakpoint

SET @echelon_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `stripe_event_log` ADD UNIQUE INDEX `stripe_event_log_stripeEventId_unique` (`stripeEventId`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @echelon_schema_name
    AND TABLE_NAME = 'stripe_event_log'
    AND INDEX_NAME = 'stripe_event_log_stripeEventId_unique'
);
--> statement-breakpoint
PREPARE echelon_stmt FROM @echelon_sql;
--> statement-breakpoint
EXECUTE echelon_stmt;
--> statement-breakpoint
DEALLOCATE PREPARE echelon_stmt;
--> statement-breakpoint

SET @echelon_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `stripe_event_log` ADD INDEX `stripe_event_log_event_type_idx` (`eventType`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @echelon_schema_name
    AND TABLE_NAME = 'stripe_event_log'
    AND INDEX_NAME = 'stripe_event_log_event_type_idx'
);
--> statement-breakpoint
PREPARE echelon_stmt FROM @echelon_sql;
--> statement-breakpoint
EXECUTE echelon_stmt;
--> statement-breakpoint
DEALLOCATE PREPARE echelon_stmt;
--> statement-breakpoint

SET @echelon_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `stripe_event_log` ADD INDEX `stripe_event_log_org_id_idx` (`orgId`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @echelon_schema_name
    AND TABLE_NAME = 'stripe_event_log'
    AND INDEX_NAME = 'stripe_event_log_org_id_idx'
);
--> statement-breakpoint
PREPARE echelon_stmt FROM @echelon_sql;
--> statement-breakpoint
EXECUTE echelon_stmt;
--> statement-breakpoint
DEALLOCATE PREPARE echelon_stmt;
--> statement-breakpoint

SET @echelon_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `stripe_event_log` ADD INDEX `stripe_event_log_status_idx` (`status`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @echelon_schema_name
    AND TABLE_NAME = 'stripe_event_log'
    AND INDEX_NAME = 'stripe_event_log_status_idx'
);
--> statement-breakpoint
PREPARE echelon_stmt FROM @echelon_sql;
--> statement-breakpoint
EXECUTE echelon_stmt;
--> statement-breakpoint
DEALLOCATE PREPARE echelon_stmt;
