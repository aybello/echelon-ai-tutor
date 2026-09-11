CREATE TABLE IF NOT EXISTS `question_content_snapshots` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `releaseKey` varchar(128) NOT NULL,
  `bankKey` varchar(64) NOT NULL,
  `questionId` int NOT NULL,
  `questionNum` int NOT NULL,
  `sourceContentVersion` int NOT NULL,
  `contentHash` varchar(64) NOT NULL,
  `payload` mediumtext NOT NULL,
  `capturedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `question_snapshot_release_question_idx` (`releaseKey`, `questionId`),
  KEY `question_snapshot_bank_question_idx` (`bankKey`, `questionId`)
);
