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
  `operatorName` varchar(200) NOT NULL,
  `certificateType` varchar(64) NOT NULL,
  `certificateNumber` varchar(100) NOT NULL,
  `issuedAt` timestamp NULL,
  `expiresAt` timestamp NOT NULL,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `certificates_org_expiry_idx` (`organizationId`, `expiresAt`),
  KEY `certificates_operator_idx` (`operatorUserId`),
  KEY `certificates_expiry_idx` (`expiresAt`)
);
--> statement-breakpoint
CREATE TABLE `certificate_alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `certificateId` int NOT NULL,
  `thresholdDays` int NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `recipientUserId` int,
  `recipientEmail` varchar(320) NOT NULL,
  `sentAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_alerts_unique_idx` (`certificateId`, `thresholdDays`, `expiresAt`, `recipientEmail`),
  KEY `certificate_alerts_cert_idx` (`certificateId`)
);
