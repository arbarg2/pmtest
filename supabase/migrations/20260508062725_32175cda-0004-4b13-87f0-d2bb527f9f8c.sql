
-- Lock down audit_logs: remove client INSERT (server-side via edge function)
DROP POLICY IF EXISTS "Users insert own audit logs" ON public.audit_logs;

-- Restrict wallet_cache reads to authenticated users only
DROP POLICY IF EXISTS "Anyone can read wallet cache" ON public.wallet_cache;
CREATE POLICY "Authenticated users can read wallet cache"
  ON public.wallet_cache FOR SELECT
  TO authenticated
  USING (true);
