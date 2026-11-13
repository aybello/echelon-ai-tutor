-- Additive only. Historical contact rows remain unchanged and may have NULL request keys.
ALTER TABLE `contact_submissions` ADD COLUMN `requestKey` varchar(36) NULL;
--> statement-breakpoint
ALTER TABLE `contact_submissions` ADD COLUMN `organization` varchar(128) NULL;
--> statement-breakpoint
ALTER TABLE `contact_submissions` ADD COLUMN `partnershipType` varchar(64) NULL;
--> statement-breakpoint
ALTER TABLE `contact_submissions` ADD COLUMN `followUpStatus` varchar(16) NOT NULL DEFAULT 'new';
--> statement-breakpoint
ALTER TABLE `contact_submissions` ADD COLUMN `notificationStatus` varchar(16) NOT NULL DEFAULT 'pending';
--> statement-breakpoint
CREATE UNIQUE INDEX `contact_request_key_unique` ON `contact_submissions` (`requestKey`);
