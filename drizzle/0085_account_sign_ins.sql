CREATE TABLE `account_sign_ins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int,
  `verifiedEmail` varchar(320),
  `method` enum('oauth','email_otp','dashboard_otp','legacy_magic_link') NOT NULL,
  `signedInAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `signin_account_id_idx` (`userId`, `id`),
  KEY `signin_email_id_idx` (`verifiedEmail`, `id`)
);
