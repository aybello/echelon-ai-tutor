CREATE TABLE `job_postings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`company` varchar(255),
	`location` varchar(255),
	`province` enum('ON','BC','AB','SK','MB','other') NOT NULL DEFAULT 'other',
	`salary` varchar(255),
	`jobType` enum('full-time','part-time','contract') NOT NULL DEFAULT 'full-time',
	`sourceUrl` varchar(1024) NOT NULL,
	`sourceName` varchar(128) NOT NULL,
	`sourceType` enum('rss','scraper') NOT NULL DEFAULT 'rss',
	`description` text,
	`postedAt` timestamp,
	`isFeatured` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_postings_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_postings_sourceUrl_unique` UNIQUE(`sourceUrl`)
);
--> statement-breakpoint
CREATE INDEX `job_province_idx` ON `job_postings` (`province`);--> statement-breakpoint
CREATE INDEX `job_type_idx` ON `job_postings` (`jobType`);--> statement-breakpoint
CREATE INDEX `job_posted_at_idx` ON `job_postings` (`postedAt`);--> statement-breakpoint
CREATE INDEX `job_active_idx` ON `job_postings` (`isActive`);