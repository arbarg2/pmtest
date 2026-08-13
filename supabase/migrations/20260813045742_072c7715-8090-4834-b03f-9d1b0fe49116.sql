SELECT cron.schedule(
  'sync-sanctions-backfill-once',
  '* * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://nqjorzsehawucorvaqyi.supabase.co/functions/v1/sync-sanctions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret')
    ),
    body := '{"backfill": true}'::jsonb
  );
  $job$
);