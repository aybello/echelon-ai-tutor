CREATE TABLE IF NOT EXISTS `flashcard_progress_state` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(320) NOT NULL,
  `examType` varchar(64) NOT NULL,
  `knownIds` mediumtext NOT NULL,
  `totalCards` int NOT NULL DEFAULT 0,
  UNIQUE KEY `flashcard_state_identity_idx` (`email`, `examType`)
);
CREATE TABLE IF NOT EXISTS `flashcard_progress_operations` (
  `operationId` varchar(64) PRIMARY KEY,
  `email` varchar(320) NOT NULL,
  `examType` varchar(64) NOT NULL,
  `payloadHash` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
