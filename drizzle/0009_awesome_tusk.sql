ALTER TABLE `exam_results` ADD `province` varchar(32);--> statement-breakpoint
ALTER TABLE `purchases` ADD `province` varchar(32);--> statement-breakpoint
ALTER TABLE `purchases` ADD `utmSource` varchar(128);--> statement-breakpoint
ALTER TABLE `purchases` ADD `utmMedium` varchar(128);--> statement-breakpoint
ALTER TABLE `purchases` ADD `utmCampaign` varchar(128);--> statement-breakpoint
ALTER TABLE `purchases` ADD `referralSource` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `province` varchar(32);