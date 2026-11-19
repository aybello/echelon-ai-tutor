-- Additive supplemental observations only. Existing attempts, scores, access and study tools are unchanged.
-- userId and verified emailHash are separate identity namespaces; anonymous has neither.
-- All time columns are UTC epoch milliseconds assigned by the server; activeSeconds is NULL.
CREATE TABLE `assessment_activity_sessions` (
  `sessionId` varchar(36) NOT NULL,
  `actorHash` varchar(64) NOT NULL,
  `identityKind` enum('user','verified-email','anonymous') NOT NULL,
  `userId` int,
  `emailHash` varchar(64),
  `orgId` int,
  `organizationMemberId` int,
  `flexLicenceId` int,
  `courseKey` varchar(64) NOT NULL,
  `mode` varchar(32) NOT NULL,
  `source` varchar(16) NOT NULL DEFAULT 'observed',
  `sourceSessionId` varchar(80),
  `status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
  `timed` boolean,
  `itemCount` int NOT NULL,
  `issuedItemsJson` mediumtext NOT NULL,
  `manifestHash` varchar(64) NOT NULL,
  `startedAt` bigint NOT NULL,
  `lastObservedAt` bigint NOT NULL,
  `endedAt` bigint,
  `expiresAt` bigint NOT NULL,
  `activeSeconds` int,
  `lastSequence` int NOT NULL DEFAULT 1,
  `eventCount` int NOT NULL DEFAULT 1,
  PRIMARY KEY (`sessionId`),
  KEY `aas_actor_started_idx` (`actorHash`, `startedAt`),
  KEY `aas_user_started_idx` (`userId`, `startedAt`),
  KEY `aas_email_started_idx` (`emailHash`, `startedAt`),
  KEY `aas_org_started_idx` (`orgId`, `startedAt`)
);
--> statement-breakpoint
CREATE TABLE `assessment_activity_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(36) NOT NULL,
  `eventId` varchar(36) NOT NULL,
  `sequence` int NOT NULL,
  `action` varchar(32) NOT NULL,
  `itemId` varchar(80),
  `stepId` varchar(80),
  `chosenAnswer` varchar(80),
  `observedCorrect` boolean,
  `source` varchar(16) NOT NULL DEFAULT 'observed',
  `payloadHash` varchar(64) NOT NULL,
  `occurredAt` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `aae_session_event_unique` (`sessionId`, `eventId`),
  UNIQUE KEY `aae_session_sequence_unique` (`sessionId`, `sequence`)
);
