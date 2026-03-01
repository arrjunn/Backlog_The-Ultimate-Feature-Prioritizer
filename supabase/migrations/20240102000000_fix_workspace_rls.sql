-- ============================================================
-- PATCH: Allow workspace owners to see their own workspaces
-- immediately after creation (before workspace_members insert)
-- Run this in Supabase SQL Editor if you already ran the
-- initial migration.
-- ============================================================

-- Add owner-based SELECT policy so the workspace is visible
-- immediately after INSERT (before the workspace_members row exists)
CREATE POLICY "Owners can always view their workspaces"
  ON public.workspaces FOR SELECT
  USING (owner_id = auth.uid());
