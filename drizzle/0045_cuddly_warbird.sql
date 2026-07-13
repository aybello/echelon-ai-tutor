CREATE TABLE `email_otp_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`codeHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_otp_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `magic_links` DROP INDEX `magic_links_token_unique`;--> statement-breakpoint
ALTER TABLE `magic_links` ADD `tokenHash` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `magic_links` ADD CONSTRAINT `magic_links_tokenHash_unique` UNIQUE(`tokenHash`);--> statement-breakpoint
CREATE INDEX `otp_email_idx` ON `email_otp_codes` (`email`);--> statement-breakpoint
ALTER TABLE `magic_links` DROP COLUMN `token`;