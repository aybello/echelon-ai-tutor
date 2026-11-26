CREATE TABLE IF NOT EXISTS `scheduled_work` (
  `workKey` varchar(191) PRIMARY KEY,
  `leaseVersion` int NOT NULL DEFAULT 0,
  `status` varchar(16) NOT NULL DEFAULT 'pending',
  `claimToken` varchar(36),
  `leaseUntil` timestamp NULL,
  `attempts` int NOT NULL DEFAULT 0,
  `lastError` text,
  `completedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
