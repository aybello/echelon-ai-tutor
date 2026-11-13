ALTER TABLE `stripe_event_log`
  ADD COLUMN `analyticsProcessed` boolean NOT NULL DEFAULT false;
