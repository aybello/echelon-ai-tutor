ALTER TABLE `question_attempts` ADD `confidence` enum('low','medium','high');--> statement-breakpoint
ALTER TABLE `question_attempts` ADD `bookmarked` enum('yes','no') DEFAULT 'no';