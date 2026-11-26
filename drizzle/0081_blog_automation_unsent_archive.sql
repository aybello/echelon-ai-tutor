-- Sparse audit evidence for an exact, pre-transport credential failure.
-- This table intentionally excludes draft, research, provider IDs, payloads,
-- raw errors, credentials, and lease tokens.
CREATE TABLE `blog_automation_run_archives` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sourceRunId` varchar(64) NOT NULL,
  `sourceRunKey` varchar(32) NOT NULL,
  `sourceStatus` varchar(16) NOT NULL,
  `phase` varchar(32) NOT NULL,
  `attempts` int NOT NULL,
  `failureService` varchar(32) NOT NULL,
  `failureKind` varchar(64) NOT NULL,
  `archiveReason` varchar(64) NOT NULL,
  `sourceStartedAt` timestamp NOT NULL,
  `sourceFailedAt` timestamp NOT NULL,
  `archivedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_run_archive_source_unique` (`sourceRunId`, `sourceRunKey`),
  KEY `blog_run_archive_archived_idx` (`archivedAt`)
);
