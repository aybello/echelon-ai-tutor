-- Retake Extensions are available to Course Pass operators who verify by email.
-- They may not have an OAuth user record, so the purchaser reference is nullable.
ALTER TABLE `team_flex_extensions`
  MODIFY COLUMN `purchaserUserId` int NULL;
