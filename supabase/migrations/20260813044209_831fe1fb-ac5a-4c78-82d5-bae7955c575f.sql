CREATE TABLE public.health_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address text NOT NULL,
  network text NOT NULL,
  verdict text NOT NULL,
  risk_score integer NOT NULL,
  report jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.health_reports TO anon;
GRANT SELECT ON public.health_reports TO authenticated;
GRANT ALL ON public.health_reports TO service_role;

ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Health reports are publicly readable by link"
  ON public.health_reports FOR SELECT
  USING (true);

CREATE INDEX health_reports_created_at_idx ON public.health_reports (created_at DESC);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alert_email_enabled boolean NOT NULL DEFAULT true;