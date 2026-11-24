-- Operator licence expiry tracking: an organization's register of its
-- operators' provincial certificates (type, number, expiry date) plus the
-- log of threshold alert emails sent for each certificate. New tables only;
-- no existing table, pricing, checkout, entitlement, scoring, production
-- data or employer-routing behaviour is changed.
-- MySQL TIMESTAMP values are stored in UTC; defaults and updates are database-owned.
CREATE TABLE `certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `operatorUserId` int,
  `operatorMemberId` int,
  `operatorName` varchar(200) NOT NULL,
  `certificateType` varchar(64) NOT NULL,
  `certificateNumber` varchar(100) NOT NULL,
  `issuedAt` datetime NULL,
  `expiresAt` datetime NOT NULL,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `version` int NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `certificates_org_expiry_idx` (`organizationId`, `expiresAt`),
  KEY `certificates_operator_idx` (`operatorUserId`),
  KEY `certificates_expiry_idx` (`expiresAt`),
  UNIQUE KEY `certificates_org_type_number_idx` (`organizationId`, `certificateType`, `certificateNumber`)
);
--> statement-breakpoint
CREATE TABLE `certificate_alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `certificateId` int NOT NULL,
  `thresholdDays` int NOT NULL,
  `expiresAt` datetime NOT NULL,
  `recipientUserId` int,
  `recipientEmail` varchar(320) NOT NULL,
  `status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `claimToken` varchar(64),
  `leaseUntil` datetime NULL,
  `attemptCount` int NOT NULL DEFAULT 0,
  `lastError` varchar(500),
  `sentAt` datetime NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_alerts_unique_idx` (`certificateId`, `thresholdDays`, `expiresAt`, `recipientEmail`),
  KEY `certificate_alerts_cert_idx` (`certificateId`),
  KEY `certificate_alerts_claim_idx` (`status`, `leaseUntil`)
);
