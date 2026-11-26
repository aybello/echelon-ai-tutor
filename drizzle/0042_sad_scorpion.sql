ALTER TABLE `organization_members` ADD `lastRemindedAt` timestamp;--> statement-breakpoint
ALTER TABLE `organization_members` ADD `reminderOptOut` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `organization_members` ADD `unsubscribeToken` varchar(128);