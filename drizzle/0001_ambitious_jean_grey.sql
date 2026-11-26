CREATE TABLE `command_drill_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`drillName` varchar(255) NOT NULL,
	`queuedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `command_drill_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cdq_user_idx` ON `command_drill_queue` (`userId`);