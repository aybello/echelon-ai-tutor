CREATE TABLE `module_overviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankKey` varchar(64) NOT NULL,
	`overviewsJson` text NOT NULL,
	CONSTRAINT `module_overviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_overview_idx` UNIQUE(`bankKey`)
);
--> statement-breakpoint
CREATE TABLE `question_bank_meta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankKey` varchar(64) NOT NULL,
	`modules` text NOT NULL,
	`moduleTargets` text,
	`formulaLinks` text,
	`totalQuestions` int NOT NULL,
	CONSTRAINT `question_bank_meta_id` PRIMARY KEY(`id`),
	CONSTRAINT `question_bank_meta_bankKey_unique` UNIQUE(`bankKey`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankKey` varchar(64) NOT NULL,
	`questionNum` int NOT NULL,
	`module` varchar(128) NOT NULL,
	`difficulty` varchar(16),
	`question` text NOT NULL,
	`optionA` text NOT NULL,
	`optionB` text NOT NULL,
	`optionC` text NOT NULL,
	`optionD` text NOT NULL,
	`correctIndex` int NOT NULL,
	`explanation` text NOT NULL,
	`steps` text,
	`tip` text,
	`isCalc` enum('yes','no') NOT NULL DEFAULT 'no',
	`topic` varchar(128),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_question_idx` UNIQUE(`bankKey`,`questionNum`)
);
