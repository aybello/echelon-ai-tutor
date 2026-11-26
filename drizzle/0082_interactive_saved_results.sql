-- Additive only: two new tables for saved game results. No existing table is changed.
-- learnerKey is "user:<id>" or "email:<address>". Anonymous play is not stored.
CREATE TABLE `interactive_item_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `learnerKey` varchar(330) NOT NULL,
  `courseKey` varchar(64) NOT NULL,
  `itemId` varchar(80) NOT NULL,
  `mode` varchar(24) NOT NULL,
  `attempts` int NOT NULL DEFAULT 0,
  `correctCount` int NOT NULL DEFAULT 0,
  `box` int NOT NULL DEFAULT 0,
  `lastCorrect` boolean NOT NULL,
  `lastAttemptAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dueAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `iip_learner_item_unique` (`learnerKey`, `courseKey`, `itemId`),
  KEY `iip_learner_due_idx` (`learnerKey`, `courseKey`, `dueAt`)
);
--> statement-breakpoint
CREATE TABLE `interactive_daily_activity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `learnerKey` varchar(330) NOT NULL,
  `activityDate` varchar(10) NOT NULL,
  `answered` int NOT NULL DEFAULT 0,
  `correct` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ida_learner_day_unique` (`learnerKey`, `activityDate`)
);
