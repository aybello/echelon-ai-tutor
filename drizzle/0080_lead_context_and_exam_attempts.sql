-- Additive only. No retrospective consent and no deletion/rewrite of exam history.
ALTER TABLE `trial_emails` ADD COLUMN `studyContext` varchar(128) NULL;
ALTER TABLE `trial_emails` ADD COLUMN `followUpConsentAt` timestamp NULL;
ALTER TABLE `trial_emails` ADD COLUMN `followUpConsentVersion` varchar(32) NULL;
ALTER TABLE `exam_outcomes` ADD COLUMN `examAttemptKey` varchar(64) NULL;
CREATE UNIQUE INDEX `exam_outcomes_attempt_key_idx` ON `exam_outcomes` (`examAttemptKey`);
