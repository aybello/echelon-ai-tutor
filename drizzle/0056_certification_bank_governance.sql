CREATE TABLE `certification_bank_versions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `programKey` varchar(128) NOT NULL,
  `bankKey` varchar(64) NOT NULL,
  `versionKey` varchar(128) NOT NULL,
  `blueprintVersion` varchar(255) NOT NULL,
  `releaseChannel` enum('internal','beta','public','retired') NOT NULL DEFAULT 'internal',
  `itemTarget` int NOT NULL,
  `active` boolean NOT NULL DEFAULT false,
  `allocationChecksum` varchar(64) NOT NULL,
  `sourceManifestChecksum` varchar(64) NOT NULL,
  `commercialEligibility` boolean NOT NULL DEFAULT false,
  `teamEligibility` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `publishedAt` timestamp NULL,
  `retiredAt` timestamp NULL,
  CONSTRAINT `certification_bank_versions_id` PRIMARY KEY(`id`),
  CONSTRAINT `cert_bank_version_unique_idx` UNIQUE(`bankKey`,`versionKey`),
  INDEX `cert_bank_blueprint_idx` (`bankKey`,`blueprintVersion`),
  INDEX `cert_bank_program_active_idx` (`programKey`,`active`,`releaseChannel`)
);
--> statement-breakpoint
CREATE TABLE `certification_sources` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sourceKey` varchar(128) NOT NULL,
  `publisher` varchar(255) NOT NULL,
  `title` varchar(512) NOT NULL,
  `stableUrl` varchar(1024) NOT NULL,
  `editionVersion` varchar(255),
  `retrievedAt` timestamp NOT NULL,
  `sha256` varchar(64) NOT NULL,
  `rightsBasis` enum('public_official_reference','permission_granted','licensed_access_required') NOT NULL,
  `permittedUsage` text NOT NULL,
  `verifiedAt` timestamp NOT NULL,
  CONSTRAINT `certification_sources_id` PRIMARY KEY(`id`),
  CONSTRAINT `cert_source_version_unique_idx` UNIQUE(`sourceKey`,`sha256`),
  INDEX `cert_source_key_idx` (`sourceKey`),
  INDEX `cert_source_rights_idx` (`rightsBasis`)
);
--> statement-breakpoint
CREATE TABLE `certification_blueprint_tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bankVersionId` int NOT NULL,
  `mwaCode` varchar(4) NOT NULL,
  `taskCode` varchar(16) NOT NULL,
  `title` varchar(255) NOT NULL,
  `officialTarget` decimal(5,2) NOT NULL,
  `bankTarget` int NOT NULL,
  `sourceId` int NOT NULL,
  `sourceReference` varchar(512) NOT NULL,
  CONSTRAINT `certification_blueprint_tasks_id` PRIMARY KEY(`id`),
  CONSTRAINT `cert_blueprint_task_unique_idx` UNIQUE(`bankVersionId`,`taskCode`),
  INDEX `cert_blueprint_mwa_idx` (`bankVersionId`,`mwaCode`)
);
--> statement-breakpoint
CREATE TABLE `certification_questions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bankVersionId` int NOT NULL,
  `bankItemNumber` int NOT NULL,
  `taskId` int NOT NULL,
  `module` varchar(4) NOT NULL,
  `taskCode` varchar(16) NOT NULL,
  `subtaskCode` varchar(16) NOT NULL,
  `topic` varchar(128) NOT NULL,
  `difficulty` enum('easy','medium','hard') NOT NULL,
  `questionType` enum('foundation','applied_scenario','troubleshooting_or_calculation') NOT NULL,
  `cognitiveLevel` enum('recall','procedural_application','critical_thinking') NOT NULL,
  `question` text NOT NULL,
  `options` text NOT NULL,
  `correctIndex` int NOT NULL,
  `explanation` text NOT NULL,
  `steps` text,
  `tip` text,
  `isCalc` enum('yes','no') NOT NULL DEFAULT 'no',
  `diagramId` varchar(64),
  `diagramAlt` text,
  `sourceId` int NOT NULL,
  `sourceReference` varchar(512) NOT NULL,
  `blueprintObjective` varchar(512) NOT NULL,
  `authorIdentity` varchar(320) NOT NULL,
  `origin` enum('human','ai_assisted','imported') NOT NULL,
  `contentHash` varchar(64) NOT NULL,
  `contentStatus` enum('draft','editorial_approved','technical_approved','beta_approved','rejected','retired') NOT NULL DEFAULT 'draft',
  `publicEligibility` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `retiredAt` timestamp NULL,
  CONSTRAINT `certification_questions_id` PRIMARY KEY(`id`),
  CONSTRAINT `cert_question_bank_item_unique_idx` UNIQUE(`bankVersionId`,`bankItemNumber`),
  CONSTRAINT `cert_question_content_hash_unique_idx` UNIQUE(`bankVersionId`,`contentHash`),
  INDEX `cert_question_delivery_idx` (`bankVersionId`,`contentStatus`,`publicEligibility`),
  INDEX `cert_question_task_idx` (`bankVersionId`,`taskCode`)
);
--> statement-breakpoint
CREATE TABLE `certification_content_reviews` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bankVersionId` int NOT NULL,
  `contentKind` enum('question','diagram','flashcard','module_note') NOT NULL,
  `contentId` int NOT NULL,
  `authorIdentity` varchar(320) NOT NULL,
  `reviewerIdentity` varchar(320) NOT NULL,
  `reviewType` enum('editorial','technical','beta_release') NOT NULL,
  `decision` enum('approved','changes_requested','rejected') NOT NULL,
  `notes` text,
  `reviewedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `certification_content_reviews_id` PRIMARY KEY(`id`),
  INDEX `cert_review_content_idx` (`contentKind`,`contentId`,`reviewType`),
  INDEX `cert_review_bank_idx` (`bankVersionId`,`reviewedAt`)
);
--> statement-breakpoint
CREATE TABLE `certification_import_runs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bankVersionId` int NOT NULL,
  `manifestChecksum` varchar(64) NOT NULL,
  `dryRun` boolean NOT NULL DEFAULT true,
  `importerIdentity` varchar(320) NOT NULL,
  `status` enum('planned','validated','completed','failed') NOT NULL DEFAULT 'planned',
  `insertedCount` int NOT NULL DEFAULT 0,
  `updatedCount` int NOT NULL DEFAULT 0,
  `rejectedCount` int NOT NULL DEFAULT 0,
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `completedAt` timestamp NULL,
  CONSTRAINT `certification_import_runs_id` PRIMARY KEY(`id`),
  CONSTRAINT `cert_import_manifest_unique_idx` UNIQUE(`bankVersionId`,`manifestChecksum`),
  INDEX `cert_import_status_idx` (`status`,`createdAt`)
);
--> statement-breakpoint
CREATE TABLE `certification_diagrams` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bankVersionId` int NOT NULL,
  `diagramId` varchar(64) NOT NULL,
  `version` int NOT NULL DEFAULT 1,
  `componentKey` varchar(255) NOT NULL,
  `altText` text NOT NULL,
  `sourceId` int NOT NULL,
  `rightsMetadata` text NOT NULL,
  `authorIdentity` varchar(320) NOT NULL,
  `contentStatus` enum('draft','editorial_approved','technical_approved','beta_approved','rejected','retired') NOT NULL DEFAULT 'draft',
  `retiredAt` timestamp NULL,
  CONSTRAINT `certification_diagrams_id` PRIMARY KEY(`id`),
  CONSTRAINT `cert_diagram_version_unique_idx` UNIQUE(`bankVersionId`,`diagramId`,`version`),
  INDEX `cert_diagram_delivery_idx` (`bankVersionId`,`contentStatus`)
);
--> statement-breakpoint
CREATE TABLE `certification_flashcards` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bankVersionId` int NOT NULL,
  `taskId` int NOT NULL,
  `cardNumber` int NOT NULL,
  `front` text NOT NULL,
  `back` text NOT NULL,
  `sourceId` int NOT NULL,
  `sourceReference` varchar(512) NOT NULL,
  `authorIdentity` varchar(320) NOT NULL,
  `contentStatus` enum('draft','editorial_approved','technical_approved','beta_approved','rejected','retired') NOT NULL DEFAULT 'draft',
  `retiredAt` timestamp NULL,
  CONSTRAINT `certification_flashcards_id` PRIMARY KEY(`id`),
  CONSTRAINT `cert_flashcard_number_unique_idx` UNIQUE(`bankVersionId`,`cardNumber`),
  INDEX `cert_flashcard_delivery_idx` (`bankVersionId`,`contentStatus`)
);
--> statement-breakpoint
CREATE TABLE `certification_module_notes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bankVersionId` int NOT NULL,
  `moduleCode` varchar(4) NOT NULL,
  `taskCode` varchar(16),
  `sectionsJson` text NOT NULL,
  `sourceId` int NOT NULL,
  `sourceReference` varchar(512) NOT NULL,
  `authorIdentity` varchar(320) NOT NULL,
  `contentStatus` enum('draft','editorial_approved','technical_approved','beta_approved','rejected','retired') NOT NULL DEFAULT 'draft',
  `retiredAt` timestamp NULL,
  CONSTRAINT `certification_module_notes_id` PRIMARY KEY(`id`),
  CONSTRAINT `cert_module_note_scope_unique_idx` UNIQUE(`bankVersionId`,`moduleCode`,`taskCode`),
  INDEX `cert_module_note_delivery_idx` (`bankVersionId`,`contentStatus`)
);
