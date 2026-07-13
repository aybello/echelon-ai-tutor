CREATE TABLE `dashboard_otps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dashboard_otps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `question_attempts` ADD `studentEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD `studentEmail` varchar(320);