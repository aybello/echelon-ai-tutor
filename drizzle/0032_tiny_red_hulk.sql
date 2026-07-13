ALTER TABLE `question_attempts` ADD `sessionId` varchar(36);--> statement-breakpoint
CREATE INDEX `qa_userid_createdat_idx` ON `question_attempts` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `qa_email_createdat_idx` ON `question_attempts` (`studentEmail`,`createdAt`);--> statement-breakpoint
CREATE INDEX `qa_sessionid_idx` ON `question_attempts` (`sessionId`);--> statement-breakpoint
CREATE INDEX `trigger_logs_userid_sentat_idx` ON `trigger_logs` (`userId`,`sentAt`);--> statement-breakpoint
CREATE INDEX `trigger_logs_email_sentat_idx` ON `trigger_logs` (`studentEmail`,`sentAt`);