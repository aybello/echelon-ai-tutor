CREATE TABLE `blog_automation_runs` (
  `id` varchar(64) NOT NULL,
  `runKey` varchar(32) NOT NULL,
  `status` varchar(16) NOT NULL,
  `progress` mediumtext NOT NULL,
  `weeklyTaskUid` varchar(65),
  `workerTaskUid` varchar(65),
  `claimToken` varchar(64),
  `leaseUntil` timestamp NULL,
  `attempts` int NOT NULL DEFAULT 0,
  `lastError` varchar(500),
  `startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `blog_weekly_task_idx` (`weeklyTaskUid`),
  KEY `blog_worker_task_idx` (`workerTaskUid`)
);
