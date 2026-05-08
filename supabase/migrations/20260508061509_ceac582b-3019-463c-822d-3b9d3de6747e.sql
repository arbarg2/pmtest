
-- public_checks: lock down writes to service role only (edge function bypasses RLS)
DROP POLICY IF EXISTS "Anyone can insert public checks" ON public.public_checks;
DROP POLICY IF EXISTS "Anyone can update view counter" ON public.public_checks;

-- wallet_cache: lock down writes to service role only
DROP POLICY IF EXISTS "Authenticated can insert cache" ON public.wallet_cache;
DROP POLICY IF EXISTS "Authenticated can update cache" ON public.wallet_cache;

-- watch_alerts: remove from realtime publication to prevent any auth user
-- subscribing to a shared channel and receiving other users' alert rows.
ALTER PUBLICATION supabase_realtime DROP TABLE public.watch_alerts;
