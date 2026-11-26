-- Additive manager-facing certificate workflow fields and private evidence/audit metadata.
ALTER TABLE `certificates` ADD COLUMN `followUpOwner` varchar(200) NULL;
ALTER TABLE `certificates` ADD COLUMN `followUpStatus` varchar(24) NOT NULL DEFAULT 'open';
ALTER TABLE `certificates` ADD COLUMN `rosterReviewStatus` varchar(24) NOT NULL DEFAULT 'not_needed';
CREATE TABLE `certificate_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `certificateId` int NOT NULL,
  `actorUserId` int NULL,
  `action` varchar(32) NOT NULL,
  `changes` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `certificate_audit_org_cert_idx` (`organizationId`, `certificateId`, `createdAt`)
);
CREATE TABLE `certificate_evidence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `certificateId` int NOT NULL,
  `objectKey` varchar(512) NOT NULL,
  `fileName` varchar(200) NOT NULL,
  `contentType` varchar(100) NOT NULL,
  `byteSize` int NOT NULL,
  `reviewedByUserId` int NULL,
  `reviewedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `certificate_evidence_org_cert_idx` (`organizationId`, `certificateId`)
);
