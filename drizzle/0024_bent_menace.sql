ALTER TABLE `purchases` ADD `status` varchar(32) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `purchases` ADD `refundedAt` timestamp;