CREATE TABLE `command_drill_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`drillName` varchar(255) NOT NULL,
	`queuedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `command_drill_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `command_run_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioId` varchar(60) NOT NULL,
	`scenarioTitle` varchar(120) NOT NULL,
	`commandScore` int NOT NULL,
	`optimalCalls` int NOT NULL,
	`totalSteps` int NOT NULL,
	`elapsedSeconds` int NOT NULL DEFAULT 0,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `command_run_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cdq_user_idx` ON `command_drill_queue` (`userId`);--> statement-breakpoint
CREATE INDEX `crh_user_idx` ON `command_run_history` (`userId`);--> statement-breakpoint
CREATE INDEX `crh_scenario_idx` ON `command_run_history` (`scenarioId`);--> statement-breakpoint
CREATE INDEX `crh_score_idx` ON `command_run_history` (`commandScore`);