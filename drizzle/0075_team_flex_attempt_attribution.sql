-- Additive only. No historical backfill: old activity cannot prove a Flex licence.
ALTER TABLE question_attempts ADD COLUMN flexLicenceId INT NULL;
CREATE INDEX qa_flex_licence_created_idx ON question_attempts (flexLicenceId, createdAt);
