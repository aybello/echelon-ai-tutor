CREATE TABLE `trial_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(32) NOT NULL DEFAULT 'quiz_gate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trial_emails_id` PRIMARY KEY(`id`)
);
