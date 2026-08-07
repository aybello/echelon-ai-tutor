-- Migration: 0046_teams_webhook_reliability
-- Adds onboardingEmailSentAt to organizations and creates stripe_event_log table
-- with processingToken/processingStartedAt for atomic event claiming.
--
-- Safe to run on both empty and existing production databases.
-- onboardingEmailSentAt and stripe_event_log may already exist from a prior
-- partial deployment; the IF NOT EXISTS / IF NOT COLUMN guards handle that.

-- 1. Add onboardingEmailSentAt to organizations (idempotent)
ALTER TABLE `organizations`
  ADD COLUMN IF NOT EXISTS `onboardingEmailSentAt` timestamp NULL;

-- 2. Create stripe_event_log (idempotent)
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
  CONSTRAINT `stripe_event_log_stripeEventId_unique` UNIQUE (`stripeEventId`)
);

-- 3. Add indexes (idempotent via CREATE INDEX IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS `stripe_event_log_event_type_idx`
  ON `stripe_event_log` (`eventType`);

CREATE INDEX IF NOT EXISTS `stripe_event_log_org_id_idx`
  ON `stripe_event_log` (`orgId`);

CREATE INDEX IF NOT EXISTS `stripe_event_log_status_idx`
  ON `stripe_event_log` (`status`);

-- 4. Add processingToken and processingStartedAt if table already existed
--    without them (handles partial prior deployment)
ALTER TABLE `stripe_event_log`
  ADD COLUMN IF NOT EXISTS `processingToken` varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS `processingStartedAt` timestamp NULL,
  MODIFY COLUMN `status` varchar(40) NOT NULL DEFAULT 'pending';
