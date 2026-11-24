-- Independent learner suggestions only; existing feedback, payments and access are unchanged.
-- MySQL TIMESTAMP values are stored in UTC; defaults and updates are database-owned.
CREATE TABLE `feature_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int,
  `email` varchar(320),
  `courseKey` varchar(64) NOT NULL,
  `pagePath` varchar(256) NOT NULL,
  `source` enum('dashboard','quick10','practice') NOT NULL,
  `suggestion` text NOT NULL,
  `problem` text,
  `followUpAllowed` boolean NOT NULL DEFAULT false,
  `status` enum('new','reviewing','planned','released') NOT NULL DEFAULT 'new',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `feature_requests_status_created_idx` (`status`, `createdAt`)
);
