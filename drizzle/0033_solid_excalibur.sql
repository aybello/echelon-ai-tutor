CREATE TABLE `organization_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'operator',
	`status` varchar(20) NOT NULL DEFAULT 'assigned',
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `organization_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`province` varchar(32) NOT NULL,
	`tier` varchar(32) NOT NULL DEFAULT 'all-access',
	`seatsTotal` int NOT NULL,
	`managerEmail` varchar(320) NOT NULL,
	`stripeSubscriptionId` varchar(128),
	`stripeCustomerId` varchar(128),
	`termEnd` timestamp NOT NULL,
	`billingType` varchar(16) NOT NULL DEFAULT 'stripe',
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `orgId` int;--> statement-breakpoint
CREATE INDEX `org_members_orgid_idx` ON `organization_members` (`orgId`);--> statement-breakpoint
CREATE INDEX `org_members_email_idx` ON `organization_members` (`email`);