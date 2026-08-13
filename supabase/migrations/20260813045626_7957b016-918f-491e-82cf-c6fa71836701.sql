-- The `private` schema is not exposed to the Data API, so edge functions cannot
-- call it via rpc(). Expose the check in `public` but grant EXECUTE to service_role
-- only — anon and authenticated are explicitly revoked.
DROP FUNCTION IF EXISTS private.verify_cron_secret(text);

CREATE OR REPLACE FUNCTION public.verify_cron_secret(_provided text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'sync_cron_secret'
      AND decrypted_secret = _provided
  );
$$;

REVOKE ALL ON FUNCTION public.verify_cron_secret(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_cron_secret(text) FROM anon;
REVOKE ALL ON FUNCTION public.verify_cron_secret(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_secret(text) TO service_role;