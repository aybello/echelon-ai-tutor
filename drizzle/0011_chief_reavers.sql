CREATE TABLE `flashcard_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`examType` varchar(64) NOT NULL,
	`knownIds` text NOT NULL DEFAULT ('[]'),
	`totalCards` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flashcard_progress_id` PRIMARY KEY(`id`)
);
