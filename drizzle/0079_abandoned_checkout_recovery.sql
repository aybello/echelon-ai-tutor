-- Abandoned checkout recovery.
--
-- Why: learners who reach the Stripe payment page have already decided to buy.
-- When the session expires we currently discard it, so the warmest buyer we
-- ever see becomes anonymous and unreachable. Stripe keeps a reopenable
-- recovery link and the email the buyer consented to share; this table records
-- that so exactly one recovery email can be sent per abandoned session.
--
-- Additive only. No existing column, row or index is changed.

CREATE TABLE `abandoned_checkouts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `stripeSessionId` varchar(128) NOT NULL,
  `email` varchar(320) NOT NULL,
  `productKey` varchar(64) NOT NULL,
  `productName` varchar(128),
  `amountCents` int NOT NULL DEFAULT 0,
  `currency` varchar(8) NOT NULL DEFAULT 'cad',
  `recoveryUrl` varchar(512),
  `abandonedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `recoveryEmailSentAt` timestamp NULL,
  `recoveredAt` timestamp NULL,
  `optOut` boolean NOT NULL DEFAULT false,
  `unsubscribeToken` varchar(64),
  CONSTRAINT `abandoned_checkouts_id` PRIMARY KEY(`id`),
  CONSTRAINT `abandoned_checkouts_stripeSessionId_unique` UNIQUE(`stripeSessionId`)
);

CREATE INDEX `abandoned_checkouts_email_idx` ON `abandoned_checkouts` (`email`);

CREATE INDEX `abandoned_checkouts_pending_idx` ON `abandoned_checkouts` (`recoveryEmailSentAt`, `abandonedAt`);

CREATE UNIQUE INDEX `abandoned_checkouts_unsubscribeToken_idx` ON `abandoned_checkouts` (`unsubscribeToken`);
