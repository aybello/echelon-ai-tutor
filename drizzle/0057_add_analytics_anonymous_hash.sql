ALTER TABLE `product_analytics_events`
  ADD COLUMN `anonymousHash` varchar(64) NULL AFTER `emailHash`;
--> statement-breakpoint
CREATE INDEX `analytics_anonymous_time_idx`
  ON `product_analytics_events` (`anonymousHash`, `occurredAt`);
