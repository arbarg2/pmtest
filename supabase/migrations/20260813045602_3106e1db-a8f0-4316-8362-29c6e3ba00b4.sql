-- Lets the sync-* edge functions verify a caller's cron secret against the Vault
-- value, so the shared secret lives in exactly one place.
CREATE OR REPLACE FUNCTION private.verify_cron_secret(_provided text)
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

REVOKE ALL ON FUNCTION private.verify_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.verify_cron_secret(text) TO service_role;