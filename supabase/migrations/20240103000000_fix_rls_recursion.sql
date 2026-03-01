-- ============================================================
-- FIX: Infinite recursion in workspace_members RLS policies
--
-- Root cause: The INSERT and SELECT policies on workspace_members
-- both queried workspace_members itself → infinite recursion loop.
--
-- Fix: Use a SECURITY DEFINER function that bypasses RLS to get
-- the user's workspace memberships without triggering policies.
-- ============================================================

-- Step 1: Drop all old recursive policies on workspace_members
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can insert workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can update workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can delete workspace members" ON public.workspace_members;

-- Also drop any duplicate workspaces view policy we may have added
DROP POLICY IF EXISTS "Owners can always view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;

-- Step 2: Create a SECURITY DEFINER function
-- This bypasses RLS when called, allowing safe self-reference queries
CREATE OR REPLACE FUNCTION public.get_my_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid();
$$;

-- Step 3: Recreate workspaces SELECT policy (uses security definer fn, not recursive)
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT public.get_my_workspace_ids())
  );

-- Step 4: Recreate workspace_members policies (no self-reference)

-- SELECT: members see all rows in workspaces they belong to (via security definer)
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (SELECT public.get_my_workspace_ids())
  );

-- INSERT: users can add themselves; workspace owners can add anyone
CREATE POLICY "Users can insert workspace members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: workspace owners can update member roles
CREATE POLICY "Admins can update workspace members"
  ON public.workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- DELETE: members can remove themselves; owners can remove anyone
CREATE POLICY "Admins can delete workspace members"
  ON public.workspace_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );
