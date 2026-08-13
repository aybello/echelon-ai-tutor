ALTER TABLE `purchases`
  ADD COLUMN `accessExpiresAt` timestamp NULL AFTER `status`;
