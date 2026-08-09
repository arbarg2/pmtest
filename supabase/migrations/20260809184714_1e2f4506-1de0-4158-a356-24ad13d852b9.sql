CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Move RLS helper SECURITY DEFINER functions out of the exposed public schema.
-- Existing policies follow the function OID, so they keep working.
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_workspace_member(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.has_workspace_role(uuid, uuid, public.workspace_role[]) SET SCHEMA private;

ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path TO 'public';
ALTER FUNCTION private.is_workspace_member(uuid, uuid) SET search_path TO 'public';
ALTER FUNCTION private.has_workspace_role(uuid, uuid, public.workspace_role[]) SET search_path TO 'public';

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_workspace_role(uuid, uuid, public.workspace_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_workspace_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_workspace_role(uuid, uuid, public.workspace_role[]) TO authenticated, service_role;

-- Keep a service-role-only membership check callable from edge functions.
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = _workspace_id AND m.user_id = _user_id)
$$;
REVOKE ALL ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO service_role;

-- generate_case_id no longer needs elevated privileges.
CREATE OR REPLACE FUNCTION public.generate_case_id()
RETURNS text
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT 'CASE_' || to_char(now(), 'YYMMDD') || '_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;
REVOKE ALL ON FUNCTION public.generate_case_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_case_id() TO authenticated, service_role;