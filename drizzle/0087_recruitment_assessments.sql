-- Additive only. UUID links identify an invitation, never authenticate a candidate.
-- Application timestamps are UTC epoch milliseconds, independent of MySQL session timezone.
CREATE TABLE `recruitment_assessments` (
  `id` varchar(36) NOT NULL,
  `orgId` int NOT NULL,
  `title` varchar(160) NOT NULL,
  `courseKey` varchar(64) NOT NULL,
  `courseLabel` varchar(200) NOT NULL,
  `modules` json NOT NULL,
  `questionCount` int NOT NULL,
  `timeLimitMinutes` int NULL,
  `questions` json NOT NULL,
  `creatorEmail` varchar(320) NOT NULL,
  `createdAtMs` bigint NOT NULL,
  `expiresAtMs` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recruitment_assessments_org_created_idx` (`orgId`, `createdAtMs`)
) ENGINE=InnoDB;
--> statement-breakpoint
CREATE TABLE `recruitment_assignments` (
  `id` varchar(36) NOT NULL,
  `assessmentId` varchar(36) NOT NULL,
  `orgId` int NOT NULL,
  `memberId` int NOT NULL,
  `candidateEmail` varchar(320) NOT NULL,
  `candidateName` varchar(200) NULL,
  `creatorEmail` varchar(320) NOT NULL,
  `createdAtMs` bigint NOT NULL,
  `updatedAtMs` bigint NOT NULL,
  `expiresAtMs` bigint NOT NULL,
  `startedAtMs` bigint NULL,
  `submittedAtMs` bigint NULL,
  `consentVersion` varchar(64) NULL,
  `consentAcceptedAtMs` bigint NULL,
  `status` enum('invited','active','submitted','timed_out','expired','revoked') NOT NULL DEFAULT 'invited',
  `answers` json NOT NULL,
  `score` json NULL,
  `revision` int NOT NULL DEFAULT 0,
  `revokedAtMs` bigint NULL,
  `revokedByEmail` varchar(320) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recruitment_assignment_assessment_member_unique` (`assessmentId`, `memberId`),
  KEY `recruitment_assignments_org_assessment_idx` (`orgId`, `assessmentId`),
  KEY `recruitment_assignments_candidate_idx` (`candidateEmail`, `createdAtMs`),
  CONSTRAINT `recruitment_assignment_assessment_fk`
    FOREIGN KEY (`assessmentId`) REFERENCES `recruitment_assessments` (`id`)
) ENGINE=InnoDB;
