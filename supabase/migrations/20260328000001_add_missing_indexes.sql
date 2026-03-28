-- ─────────────────────────────────────────────────────────────────────────────
-- Missing indexes identified by performance audit
-- These indexes cover the most frequent query patterns across API routes
-- ─────────────────────────────────────────────────────────────────────────────

-- Index: workspace_members by (workspace_id, role)
-- Used by: digest/route.ts admin lookup, clusters/route.ts membership check
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_role
    ON workspace_members (workspace_id, role);

-- Index: workspace_members by (workspace_id, user_id)
-- Used by: clusters/route.ts, search/route.ts, embed/route.ts membership checks
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user
    ON workspace_members (workspace_id, user_id);

-- Index: feature_requests with non-null embedding (partial index)
-- Used by: clusters/route.ts, backfill-embeddings/route.ts
CREATE INDEX IF NOT EXISTS idx_feature_requests_workspace_embedding
    ON feature_requests (workspace_id, created_at DESC)
    WHERE embedding IS NOT NULL;

-- Index: feature_requests shipped filter
-- Used by: digest/route.ts shipped count query
CREATE INDEX IF NOT EXISTS idx_feature_requests_workspace_shipped
    ON feature_requests (workspace_id, shipped_at DESC NULLS LAST)
    WHERE status = 'shipped';

-- Index: votes with creation date for digest weekly aggregation
-- Used by: digest/route.ts vote count per workspace
CREATE INDEX IF NOT EXISTS idx_votes_feature_request_created
    ON votes (feature_request_id, created_at DESC);
