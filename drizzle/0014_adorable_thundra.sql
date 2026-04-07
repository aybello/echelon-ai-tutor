CREATE TABLE `exam_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`productKey` varchar(64) NOT NULL,
	`examDate` timestamp NOT NULL,
	`remindersSent` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exam_dates_id` PRIMARY KEY(`id`)
);
