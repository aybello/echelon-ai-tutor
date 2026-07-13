CREATE TABLE `trigger_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`triggerType` varchar(32) NOT NULL,
	`emailSubject` varchar(256) NOT NULL,
	`emailBodyPreview` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`cooldownUntil` timestamp NOT NULL,
	CONSTRAINT `trigger_logs_id` PRIMARY KEY(`id`)
);
