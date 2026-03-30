CREATE TABLE `question_error_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`questionText` text NOT NULL,
	`module` varchar(64) NOT NULL,
	`reportType` varchar(32) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `question_error_reports_id` PRIMARY KEY(`id`)
);
