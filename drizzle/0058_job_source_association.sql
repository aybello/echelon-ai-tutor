UPDATE `job_postings`
SET `sourceType` = 'scraper'
WHERE `sourceType` = '';
--> statement-breakpoint
ALTER TABLE `job_postings`
MODIFY COLUMN `sourceType` enum('rss','scraper','association') NOT NULL DEFAULT 'rss';
--> statement-breakpoint
UPDATE `job_postings`
SET `sourceType` = 'association'
WHERE `sourceName` LIKE 'AWWOA%'
   OR `sourceName` LIKE 'SWWA%'
   OR `sourceName` LIKE 'CWWA%'
   OR `sourceName` LIKE 'CWRA%';
