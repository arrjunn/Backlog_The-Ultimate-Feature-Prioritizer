-- Auto-triage columns for AI-powered request classification
ALTER TABLE feature_requests
    ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('bug', 'feature', 'improvement', 'question')) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS triage_reason TEXT DEFAULT NULL;

-- Index for filtering by category and priority
CREATE INDEX IF NOT EXISTS idx_feature_requests_category
    ON feature_requests (workspace_id, category)
    WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feature_requests_priority
    ON feature_requests (workspace_id, priority)
    WHERE priority IS NOT NULL;
