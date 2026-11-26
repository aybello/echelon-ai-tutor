ALTER TABLE `questions` ADD `options` text NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `optionA`;--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `optionB`;--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `optionC`;--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `optionD`;