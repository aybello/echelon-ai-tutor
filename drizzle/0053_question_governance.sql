ALTER TABLE `questions`
  ADD COLUMN `sourceTitle` varchar(255),
  ADD COLUMN `sourceReference` varchar(512),
  ADD COLUMN `sourceUrl` varchar(1024),
  ADD COLUMN `blueprintObjective` varchar(255),
  ADD COLUMN `reviewStatus` enum('unreviewed','in_review','approved','rejected') NOT NULL DEFAULT 'unreviewed',
  ADD COLUMN `reviewedBy` varchar(320),
  ADD COLUMN `reviewedAt` timestamp NULL,
  ADD INDEX `question_review_status_idx` (`reviewStatus`),
  ADD INDEX `question_bank_review_status_idx` (`bankKey`, `reviewStatus`);
