CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Default key',
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  monthly_quota integer NOT NULL DEFAULT 1000,
  rate_limit_per_min integer NOT NULL DEFAULT 60,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own api keys" ON public.api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own api keys" ON public.api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own api keys" ON public.api_keys FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own api keys" ON public.api_keys FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);

CREATE TRIGGER trg_api_keys_updated BEFORE UPDATE ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.api_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  status_code integer NOT NULL DEFAULT 200,
  duration_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.api_requests TO authenticated;
GRANT ALL ON public.api_requests TO service_role;

ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own api requests" ON public.api_requests FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.api_keys k WHERE k.id = api_requests.api_key_id AND k.user_id = auth.uid()));

CREATE INDEX idx_api_requests_key_time ON public.api_requests(api_key_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.api_usage_this_month(_key_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.api_requests
  WHERE api_key_id = _key_id
    AND created_at >= date_trunc('month', now());
$$;