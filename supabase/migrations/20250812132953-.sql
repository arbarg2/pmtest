-- Harden RLS on watch_alerts and add triggers/index for data integrity

-- 1) Replace overly-permissive INSERT policy on watch_alerts
DROP POLICY IF EXISTS "System can create watch alerts" ON public.watch_alerts;

CREATE POLICY "Users can create alerts for their watched wallets"
ON public.watch_alerts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.watched_wallets ww
    WHERE ww.id = watch_alerts.watched_wallet_id
      AND ww.user_id = auth.uid()
  )
);

-- Allow users to mark alerts as read for their watched wallets
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'watch_alerts' 
      AND policyname = 'Users can update alerts for their watched wallets'
  ) THEN
    CREATE POLICY "Users can update alerts for their watched wallets"
    ON public.watch_alerts
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.watched_wallets ww
        WHERE ww.id = watch_alerts.watched_wallet_id
          AND ww.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.watched_wallets ww
        WHERE ww.id = watch_alerts.watched_wallet_id
          AND ww.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 2) Ensure record_id and case_id are set server-side via triggers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_record_id_before_insert'
  ) THEN
    CREATE TRIGGER set_record_id_before_insert
    BEFORE INSERT ON public.investigation_records
    FOR EACH ROW
    EXECUTE FUNCTION public.set_record_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_case_id_v2_before_insert'
  ) THEN
    CREATE TRIGGER set_case_id_v2_before_insert
    BEFORE INSERT ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.set_case_id_v2();
  END IF;
END $$;

-- 3) Enforce uniqueness of investigation_records.record_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_investigation_records_record_id_unique
ON public.investigation_records (record_id);
