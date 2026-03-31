CREATE TABLE `exam_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`examType` varchar(32) NOT NULL,
	`stream` varchar(32),
	`score` int NOT NULL,
	`total` int NOT NULL,
	`passed` enum('yes','no') NOT NULL,
	`timeTakenSeconds` int,
	`moduleBreakdown` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exam_results_id` PRIMARY KEY(`id`)
);
