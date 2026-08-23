ALTER TABLE `question_bank_meta`
  ADD COLUMN `publicationPolicy` enum('legacy_non_rejected','approved_only') NOT NULL DEFAULT 'approved_only';
--> statement-breakpoint
-- Preserve every bank that existed before this control was introduced. New
-- banks inherit the schema default and cannot publish unapproved questions.
UPDATE `question_bank_meta`
SET `publicationPolicy` = 'legacy_non_rejected';
--> statement-breakpoint
ALTER TABLE `product_analytics_events`
  ADD COLUMN `anonymousHash` varchar(64) NULL;
--> statement-breakpoint
CREATE INDEX `analytics_anonymous_time_idx`
  ON `product_analytics_events` (`anonymousHash`, `occurredAt`);
