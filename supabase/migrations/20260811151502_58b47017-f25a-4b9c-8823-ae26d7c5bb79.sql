-- 1. entity_attributions: require authentication for reads
DROP POLICY IF EXISTS "Anyone reads global attributions" ON public.entity_attributions;
CREATE POLICY "Authenticated read attributions"
ON public.entity_attributions
FOR SELECT
TO authenticated
USING (workspace_id IS NULL OR private.is_workspace_member(workspace_id, auth.uid()));

REVOKE ALL ON public.entity_attributions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_attributions TO authenticated;
GRANT ALL ON public.entity_attributions TO service_role;

-- 2. workspace_members: only the workspace creator may self-claim the first membership, as owner
DROP POLICY IF EXISTS "Admins add members" ON public.workspace_members;
CREATE POLICY "Admins add members"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  (
    user_id = auth.uid()
    AND role = 'owner'::workspace_role
    AND EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
        AND w.created_by = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.workspace_members m2
      WHERE m2.workspace_id = workspace_members.workspace_id
    )
  )
  OR private.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner'::workspace_role, 'compliance_officer'::workspace_role])
);