-- The scheduled sync jobs were sending the public anon key as their bearer token,
-- but the sync functions require CRON_SECRET. Every nightly run was rejected with 401,
-- leaving the OFAC sanctions table frozen. Store a real shared secret in Vault and
-- pass it via the x-cron-secret header instead.

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'sync_cron_secret';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'sync_cron_secret',
      'Shared secret pg_cron uses to authenticate against the sync-* edge functions'
    );
  END IF;
END $$;

SELECT cron.unschedule('sync-ofac-sanctions-daily');
SELECT cron.unschedule('sync-malicious-daily');

SELECT cron.schedule(
  'sync-ofac-sanctions-daily',
  '0 3 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://nqjorzsehawucorvaqyi.supabase.co/functions/v1/sync-sanctions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret')
    ),
    body := '{"scheduled": true}'::jsonb
  );
  $job$
);

SELECT cron.schedule(
  'sync-malicious-daily',
  '30 3 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://nqjorzsehawucorvaqyi.supabase.co/functions/v1/sync-malicious',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret')
    ),
    body := '{"scheduled": true}'::jsonb
  );
  $job$
);