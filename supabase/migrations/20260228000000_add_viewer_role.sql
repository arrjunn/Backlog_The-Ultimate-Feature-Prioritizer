-- Add 'viewer' role to workspace_members
-- The role column is a text column (not an enum), so we just add a check constraint

ALTER TABLE workspace_members
    DROP CONSTRAINT IF EXISTS workspace_members_role_check;

ALTER TABLE workspace_members
    ADD CONSTRAINT workspace_members_role_check
    CHECK (role IN ('admin', 'member', 'viewer'));
