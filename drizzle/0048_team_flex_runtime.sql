-- Migration 0048: Teams Flex / Course Pass runtime schema
-- Safe for a clean database and for Manus environments where these tables were
-- created outside the committed migration history.

CREATE TABLE IF NOT EXISTS `team_flex_orders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `purchaserUserId` int,
  `managerEmail` varchar(320) NOT NULL,
  `totalLicences` int NOT NULL,
  `subtotalCents` int NOT NULL,
  `discountRate` decimal(5,4) NOT NULL DEFAULT 0,
  `discountCents` int NOT NULL DEFAULT 0,
  `totalBeforeTaxCents` int NOT NULL,
  `taxCents` int NULL,
  `totalPaidCents` int NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'cad',
  `stripeCheckoutSessionId` varchar(128),
  `stripePaymentIntentId` varchar(128),
  `stripeCustomerId` varchar(128),
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `overlapAcknowledged` boolean NOT NULL DEFAULT false,
  `paidAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `team_flex_orders_pk` PRIMARY KEY (`id`),
  CONSTRAINT `team_flex_orders_checkout_unique` UNIQUE (`stripeCheckoutSessionId`),
  INDEX `team_flex_orders_org_status_idx` (`organizationId`, `status`)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `team_flex_order_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `courseKey` varchar(64) NOT NULL,
  `examFamily` varchar(32) NOT NULL,
  `pricingBand` varchar(32) NOT NULL,
  `courseLevel` int,
  `termMonths` int NOT NULL,
  `quantity` int NOT NULL,
  `listUnitPriceCents` int NOT NULL,
  `discountRate` decimal(5,4) NOT NULL DEFAULT 0,
  `discountedUnitPriceCents` int NOT NULL,
  `lineTotalCents` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `team_flex_order_items_pk` PRIMARY KEY (`id`),
  INDEX `team_flex_items_order_idx` (`orderId`)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `team_flex_licences` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderItemId` int NOT NULL,
  `organizationId` int NOT NULL,
  `courseKey` varchar(64) NOT NULL,
  `termMonths` int NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'unused',
  `invitedEmail` varchar(320),
  `invitationToken` varchar(128),
  `invitedAt` timestamp NULL,
  `operatorUserId` int,
  `assignedAt` timestamp NULL,
  `activatedAt` timestamp NULL,
  `accessEndsAt` timestamp NULL,
  `originalAccessEndsAt` timestamp NULL,
  `reportingEndsAt` timestamp NULL,
  `extensionApplied` boolean NOT NULL DEFAULT false,
  `extensionStartsAt` timestamp NULL,
  `activationDeadline` timestamp NOT NULL,
  `startsAt` timestamp NULL,
  `suspendedAt` timestamp NULL,
  `suspendedReason` varchar(100),
  `revokedAt` timestamp NULL,
  `revokeReason` varchar(64),
  `previousStatus` varchar(32),
  `replacedByLicenceId` int,
  `replacesLicenceId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `team_flex_licences_pk` PRIMARY KEY (`id`),
  INDEX `flex_lic_org_status_idx` (`organizationId`, `status`),
  INDEX `flex_lic_operator_idx` (`operatorUserId`, `status`, `courseKey`),
  INDEX `flex_lic_email_idx` (`invitedEmail`, `status`, `courseKey`),
  INDEX `flex_lic_deadline_idx` (`status`, `activationDeadline`),
  INDEX `flex_lic_invitation_idx` (`invitationToken`, `status`)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `team_flex_extensions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `licenceId` int NOT NULL,
  `organizationId` int NOT NULL,
  `purchaserUserId` int NOT NULL,
  `extensionDays` int NOT NULL DEFAULT 90,
  `priceCents` int NOT NULL,
  `stripeCheckoutSessionId` varchar(128),
  `stripePaymentIntentId` varchar(128),
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `appliedAt` timestamp NULL,
  `newAccessEndsAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `team_flex_extensions_pk` PRIMARY KEY (`id`),
  CONSTRAINT `team_flex_extensions_licence_unique` UNIQUE (`licenceId`)
);
--> statement-breakpoint

-- Reconcile the partial Manus schema with the server-owned expected/collected
-- payment model. These values are unknown until Stripe confirms payment.
ALTER TABLE `team_flex_orders`
  MODIFY COLUMN `purchaserUserId` int NULL,
  MODIFY COLUMN `taxCents` int NULL,
  MODIFY COLUMN `totalPaidCents` int NULL;
