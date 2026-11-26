ALTER TABLE `student_profiles` DROP INDEX `student_profiles_userId_unique`;--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `trigger_logs` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `trigger_logs` ADD `studentEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_userId_idx` UNIQUE(`userId`);--> statement-breakpoint
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_email_idx` UNIQUE(`studentEmail`);