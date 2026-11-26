CREATE TABLE `user_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`email` varchar(320),
	`examType` varchar(64) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`feedbackType` varchar(32) NOT NULL,
	`province` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_feedback_id` PRIMARY KEY(`id`)
);
