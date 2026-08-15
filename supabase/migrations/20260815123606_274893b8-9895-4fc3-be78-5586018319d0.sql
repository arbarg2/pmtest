DO $$
BEGIN
  PERFORM cron.unschedule('sync-sanctions-backfill-once');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('wallet-monitor-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'wallet-monitor-hourly',
  '0 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://nqjorzsehawucorvaqyi.supabase.co/functions/v1/wallet-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret' LIMIT 1)
    ),
    body := '{"scheduled": true}'::jsonb
  );
  $job$
);