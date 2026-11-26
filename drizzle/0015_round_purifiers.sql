CREATE TABLE `qotd_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`guestToken` varchar(64),
	`examType` varchar(64) NOT NULL,
	`questionId` int NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`correct` enum('yes','no') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qotd_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`guestToken` varchar(64),
	`examType` varchar(64) NOT NULL,
	`topic` varchar(128) NOT NULL,
	`questionId` int NOT NULL,
	`correct` enum('yes','no') NOT NULL,
	`difficulty` varchar(16),
	`quizMode` varchar(32) DEFAULT 'standard',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `question_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`examType` varchar(64) NOT NULL,
	`topicAccuracy` text NOT NULL DEFAULT ('{}'),
	`weakTopics` text NOT NULL DEFAULT ('[]'),
	`strongTopics` text NOT NULL DEFAULT ('[]'),
	`totalAttempts` int NOT NULL DEFAULT 0,
	`totalSessions` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profiles_userId_unique` UNIQUE(`userId`)
);
