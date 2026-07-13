CREATE TABLE `bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`studentEmail` varchar(320),
	`bankKey` varchar(64) NOT NULL,
	`questionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `bm_user_question_idx` UNIQUE(`userId`,`bankKey`,`questionId`),
	CONSTRAINT `bm_email_question_idx` UNIQUE(`studentEmail`,`bankKey`,`questionId`)
);
--> statement-breakpoint
CREATE INDEX `bm_userid_idx` ON `bookmarks` (`userId`);--> statement-breakpoint
CREATE INDEX `bm_email_idx` ON `bookmarks` (`studentEmail`);