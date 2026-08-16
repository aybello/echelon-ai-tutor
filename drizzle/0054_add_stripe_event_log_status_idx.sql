-- PROPOSED FORWARD-ONLY MIGRATION — NOT APPLIED TO PRODUCTION.
-- Apply only through the approved migration workflow after Ay authorizes it.
CREATE INDEX `stripe_event_log_status_idx` ON `stripe_event_log` (`status`);
