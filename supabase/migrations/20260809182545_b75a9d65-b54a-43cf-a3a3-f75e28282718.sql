-- 1. Restrict rulesets reads to authenticated users
DROP POLICY IF EXISTS "Anyone reads rulesets" ON public.rulesets;
REVOKE SELECT ON public.rulesets FROM anon;
CREATE POLICY "Authenticated users read rulesets"
  ON public.rulesets FOR SELECT TO authenticated USING (true);

-- 2. Pin search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

-- 3. Revoke direct EXECUTE on internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_record_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.api_usage_this_month(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.api_usage_this_month(uuid) TO service_role;

-- generate_case_id is called via RPC by signed-in users only
REVOKE ALL ON FUNCTION public.generate_case_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_case_id() TO authenticated, service_role;

-- RLS helper functions must stay callable by authenticated (used inside policies)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_workspace_role(uuid, uuid, public.workspace_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, public.workspace_role[]) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated, service_role;