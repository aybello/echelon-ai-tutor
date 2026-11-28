-- Standalone additive Hiring migration. Never use broad db:push.
-- Historical recruitment rows remain valid: passingScore NULL, memberId remains unchanged.
ALTER TABLE `recruitment_assessments` ADD COLUMN `passingScore` int NULL;
ALTER TABLE `recruitment_assignments` MODIFY COLUMN `memberId` int NULL;
ALTER TABLE `recruitment_assignments` ADD COLUMN `accessKind` varchar(32) NOT NULL DEFAULT 'training-seat';
ALTER TABLE `recruitment_assignments` ADD COLUMN `grantId` varchar(36) NULL;
CREATE TABLE `hiring_orders` (
  `id` varchar(36) NOT NULL,
  `orgId` int NOT NULL,
  `stripeCheckoutSessionId` varchar(128) NULL,
  `stripeSubscriptionId` varchar(128) NULL,
  `stripeCustomerId` varchar(128) NULL,
  `amountCents` int NOT NULL,
  `currency` varchar(3) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `ownerEmail` varchar(320) NOT NULL,
  `createdAtMs` bigint NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `hiring_orders_checkout_unique` (`stripeCheckoutSessionId`),
  UNIQUE KEY `hiring_orders_subscription_unique` (`stripeSubscriptionId`), KEY `hiring_orders_org_idx` (`orgId`)
) ENGINE=InnoDB;
CREATE TABLE `hiring_terms` (
  `id` varchar(36) NOT NULL,
  `orgId` int NOT NULL,
  `basis` varchar(16) NOT NULL,
  `sourceInvoiceId` varchar(128) NULL,
  `sourcePilotId` varchar(128) NULL,
  `sourceSubscriptionId` varchar(128) NULL,
  `sourcePaymentIntentId` varchar(128) NULL,
  `startsAtMs` bigint NOT NULL,
  `endsAtMs` bigint NOT NULL,
  `quota` int NOT NULL,
  `used` int NOT NULL DEFAULT 0,
  `state` varchar(32) NOT NULL DEFAULT 'active',
  `paymentState` varchar(32) NOT NULL DEFAULT 'active',
  `createdByEmail` varchar(320) NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `hiring_terms_invoice_unique` (`sourceInvoiceId`),
  UNIQUE KEY `hiring_terms_pilot_unique` (`sourcePilotId`), KEY `hiring_terms_subscription_idx` (`sourceSubscriptionId`), KEY `hiring_terms_payment_intent_idx` (`sourcePaymentIntentId`), KEY `hiring_terms_org_period_idx` (`orgId`, `startsAtMs`, `endsAtMs`)
) ENGINE=InnoDB;
CREATE TABLE `hiring_events` (
  `id` varchar(128) NOT NULL,
  `orgId` int NOT NULL,
  `orderId` varchar(36) NULL,
  `invoiceId` varchar(128) NULL,
  `eventType` varchar(64) NOT NULL,
  `state` varchar(32) NOT NULL DEFAULT 'claimed',
  `createdAtMs` bigint NOT NULL,
  PRIMARY KEY (`id`), KEY `hiring_events_org_idx` (`orgId`), KEY `hiring_events_invoice_idx` (`invoiceId`)
) ENGINE=InnoDB;
