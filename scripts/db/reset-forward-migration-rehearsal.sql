-- Reconstruct the schema immediately after the immutable 0052 baseline so the
-- complete forward-migration chain can be replayed in CI. The baseline used by
-- the test is exported from the current Drizzle schema, so every proposed-only
-- object and column transition must be explicitly returned to its pre-migration
-- state here.

DROP INDEX `exam_dates_email_product_unique` ON `exam_dates`;
DROP INDEX `stripe_event_log_status_idx` ON `stripe_event_log`;
DROP INDEX `team_flex_orders_org_status_idx` ON `team_flex_orders`;

ALTER TABLE `team_flex_extensions`
  MODIFY COLUMN `purchaserUserId` int NOT NULL;

DROP TABLE
  `customer_recovery_import_items`,
  `customer_recovery_batches`,
  `scheduled_work`,
  `flashcard_progress_operations`,
  `flashcard_progress_state`,
  `purchase_email_outbox`,
  `customer_recovery_evidence`,
  `question_content_snapshots`,
  `certification_content_reviews`,
  `certification_import_runs`,
  `certification_flashcards`,
  `certification_module_notes`,
  `certification_diagrams`,
  `certification_questions`,
  `certification_blueprint_tasks`,
  `certification_sources`,
  `certification_bank_versions`,
  `on_the_job_training_records`,
  `learning_activity_sessions`,
  `training_attestations`;

DROP INDEX `analytics_anonymous_time_idx` ON `product_analytics_events`;
ALTER TABLE `product_analytics_events` DROP COLUMN `anonymousHash`;
