-- Additive only. Existing trial lead rows remain unchanged with a NULL phone.
-- The column is nullable because the quiz gate must never block an email
-- capture on a phone number the learner chose not to give.
ALTER TABLE `trial_emails` ADD COLUMN `phone` varchar(32) NULL;
