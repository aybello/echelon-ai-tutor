ALTER TABLE `ai_chat_sessions` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `ai_chat_sessions` ADD `studentEmail` varchar(320);