CREATE TABLE `ceu_learning_records` (
  `id` int AUTO_INCREMENT NOT NULL,
  `studentEmail` varchar(320) NOT NULL,
  `courseKey` varchar(80) NOT NULL,
  `courseVersion` varchar(32) NOT NULL,
  `revision` int NOT NULL DEFAULT 0,
  `stateJson` mediumtext NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ceu_learning_records_id` PRIMARY KEY (`id`),
  CONSTRAINT `ceu_learner_course_edition` UNIQUE (`studentEmail`,`courseKey`,`courseVersion`)
);
