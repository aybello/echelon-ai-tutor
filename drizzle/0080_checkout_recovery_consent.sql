-- Additive only. Historical carts retain NULL consent; never backfill opt-in.
ALTER TABLE `abandoned_checkouts` ADD COLUMN `recoveryConsentAt` timestamp NULL;
ALTER TABLE `abandoned_checkouts` ADD COLUMN `recoveryConsentSource` varchar(64) NULL;
ALTER TABLE `abandoned_checkouts` ADD COLUMN `recoveryConsentNoticeVersion` varchar(64) NULL;
