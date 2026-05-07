
CREATE TABLE public.public_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('safe','caution','danger')),
  risk_score NUMERIC NOT NULL DEFAULT 0,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour')
);

CREATE UNIQUE INDEX public_checks_address_network_key ON public.public_checks (lower(address), network);
CREATE INDEX public_checks_created_at_idx ON public.public_checks (created_at DESC);

ALTER TABLE public.public_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public checks"
  ON public.public_checks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert public checks"
  ON public.public_checks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update view counter"
  ON public.public_checks FOR UPDATE
  USING (true)
  WITH CHECK (true);
