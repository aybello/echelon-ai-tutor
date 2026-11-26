CREATE TABLE `on_the_job_training_records` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orgId` int NOT NULL,
  `organizationMemberId` int NOT NULL,
  `studentEmail` varchar(320) NOT NULL,
  `courseKey` varchar(64),
  `sessionDate` timestamp NOT NULL,
  `topics` text NOT NULL,
  `learningObjectives` text NOT NULL,
  `providerName` varchar(200) NOT NULL,
  `providerPhone` varchar(64),
  `durationHours` decimal(5,2) NOT NULL,
  `structuredLearningConfirmed` boolean NOT NULL DEFAULT false,
  `recordedByEmail` varchar(320) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `on_the_job_training_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ojt_records_org_member_date_idx`
  ON `on_the_job_training_records` (`orgId`, `organizationMemberId`, `sessionDate`);
--> statement-breakpoint
CREATE INDEX `ojt_records_student_date_idx`
  ON `on_the_job_training_records` (`studentEmail`, `sessionDate`);
