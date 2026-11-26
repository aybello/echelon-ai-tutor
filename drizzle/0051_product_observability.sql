-- Migration 0051: durable product analytics and readiness calibration inputs.
-- Additive only; safe for the current production schema.

CREATE TABLE IF NOT EXISTS `product_analytics_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventName` varchar(64) NOT NULL,
  `occurredAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `userId` varchar(64),
  `emailHash` varchar(64),
  `examType` varchar(64),
  `productKey` varchar(64),
  `orgId` int,
  `metadata` text,
  CONSTRAINT `product_analytics_events_pk` PRIMARY KEY (`id`),
  INDEX `analytics_event_time_idx` (`eventName`, `occurredAt`),
  INDEX `analytics_email_time_idx` (`emailHash`, `occurredAt`),
  INDEX `analytics_org_time_idx` (`orgId`, `occurredAt`)
);
--> statement-breakpoint

ALTER TABLE `exam_outcomes`
  ADD COLUMN `readinessScoreAtOutcome` int NULL,
  ADD COLUMN `readinessModelVersion` varchar(64) NULL;
