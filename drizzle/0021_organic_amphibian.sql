CREATE TABLE `ai_chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`examType` varchar(64) NOT NULL,
	`messageCount` int NOT NULL DEFAULT 0,
	`topicsCovered` text NOT NULL,
	`summary` text NOT NULL,
	`resourcesSurfaced` text,
	`sessionStart` timestamp NOT NULL DEFAULT (now()),
	`sessionEnd` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_chat_sessions_id` PRIMARY KEY(`id`)
);
