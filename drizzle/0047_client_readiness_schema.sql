-- Migration 0047: Client Readiness Fix schema changes
-- Adds organization-scoping columns to question_attempts, exam_results, and exam_dates
-- These columns enable per-org analytics without email-based cross-org data leakage

-- question_attempts: add orgId, organizationMemberId, courseKey, bankKey, selectedIndex
ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS org_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS organization_member_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS course_key VARCHAR(64) DEFAULT NULL;
ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS bank_key VARCHAR(64) DEFAULT NULL;
ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS selected_index TINYINT DEFAULT NULL;

-- exam_results: add orgId, organizationMemberId, courseKey, bankKey, userId, studentEmail
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS org_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS organization_member_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS course_key VARCHAR(64) DEFAULT NULL;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS bank_key VARCHAR(64) DEFAULT NULL;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS student_email VARCHAR(255) DEFAULT NULL;

-- exam_dates: add orgId, organizationMemberId, courseKey, bankKey
ALTER TABLE exam_dates ADD COLUMN IF NOT EXISTS org_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE exam_dates ADD COLUMN IF NOT EXISTS organization_member_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE exam_dates ADD COLUMN IF NOT EXISTS course_key VARCHAR(64) DEFAULT NULL;
ALTER TABLE exam_dates ADD COLUMN IF NOT EXISTS bank_key VARCHAR(64) DEFAULT NULL;

-- org_members: add unique constraint on orgId + email to prevent duplicate assignments
-- (TiDB syntax: CREATE UNIQUE INDEX IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_org_email ON org_members(org_id, email);

-- Indexes for the new scoping columns (for manager analytics performance)
CREATE INDEX IF NOT EXISTS idx_qa_org_id ON question_attempts(org_id);
CREATE INDEX IF NOT EXISTS idx_qa_org_member ON question_attempts(organization_member_id);
CREATE INDEX IF NOT EXISTS idx_er_org_id ON exam_results(org_id);
CREATE INDEX IF NOT EXISTS idx_ed_org_id ON exam_dates(org_id);
