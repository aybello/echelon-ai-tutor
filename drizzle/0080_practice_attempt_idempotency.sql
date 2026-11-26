-- Additive only: historic and legacy-client rows retain NULL operation IDs.
-- MySQL permits multiple NULLs in a UNIQUE index; existing rows are untouched.
ALTER TABLE `question_attempts` ADD COLUMN `operationId` varchar(36) NULL;
--> statement-breakpoint
ALTER TABLE `question_attempts` ADD COLUMN `operationPayloadHash` varchar(64) NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `qa_operation_id_unique` ON `question_attempts` (`operationId`);
