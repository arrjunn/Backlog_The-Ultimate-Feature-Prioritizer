-- Performance indexes for frequently queried columns
-- These dramatically speed up workspace-scoped queries, filtering, and joins

-- Feature requests: most queries filter by workspace_id + status
CREATE INDEX IF NOT EXISTS idx_feature_requests_workspace_status
    ON feature_requests (workspace_id, status);

-- Feature requests: sorting by created_at within a workspace
CREATE INDEX IF NOT EXISTS idx_feature_requests_workspace_created
    ON feature_requests (workspace_id, created_at DESC);

-- Feature requests: sorting by rice_score (used by board + insights)
CREATE INDEX IF NOT EXISTS idx_feature_requests_workspace_rice
    ON feature_requests (workspace_id, rice_score DESC NULLS LAST);

-- Votes: lookup by feature_request_id (for vote counts + user vote check)
CREATE INDEX IF NOT EXISTS idx_votes_feature_request
    ON votes (feature_request_id);

-- Votes: unique constraint prevents double-voting (also serves as an index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_user_request
    ON votes (feature_request_id, user_id);

-- Comments: lookup by feature_request_id + chronological ordering
CREATE INDEX IF NOT EXISTS idx_comments_feature_request_created
    ON comments (feature_request_id, created_at ASC);

-- Workspace members: lookup by user_id (dashboard workspace list query)
CREATE INDEX IF NOT EXISTS idx_workspace_members_user
    ON workspace_members (user_id);

-- Workspace members: lookup by workspace_id (settings member list)
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace
    ON workspace_members (workspace_id);

-- Workspaces: lookup by slug (workspace page load)
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_slug
    ON workspaces (slug);

-- Profiles: lookup by email (invite by email feature)
CREATE INDEX IF NOT EXISTS idx_profiles_email
    ON profiles (email);
