-- Lead follow-up state on captured trial emails.
--
-- Captured leads previously received exactly one study plan email and were
-- never contacted again. The follow-up sequence needs three things recorded on
-- the lead itself: how far through the bounded sequence it is, when it was
-- last contacted, and whether it opted out. All additive and nullable or
-- defaulted, so existing rows and inserts are untouched.
ALTER TABLE `trial_emails` ADD COLUMN `followUpStage` int NOT NULL DEFAULT 0;
ALTER TABLE `trial_emails` ADD COLUMN `lastFollowUpAt` timestamp NULL;
ALTER TABLE `trial_emails` ADD COLUMN `optOut` boolean NOT NULL DEFAULT false;
ALTER TABLE `trial_emails` ADD COLUMN `unsubscribeToken` varchar(128) NULL;
