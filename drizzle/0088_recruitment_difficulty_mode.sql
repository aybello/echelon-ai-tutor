-- Standalone additive follow-up to 0087; requires recruitment_assessments to exist.
-- No default or backfill: historical assessments retain NULL (Not recorded).
ALTER TABLE `recruitment_assessments` ADD COLUMN `difficultyMode` enum('mixed','medium','hard') NULL;
