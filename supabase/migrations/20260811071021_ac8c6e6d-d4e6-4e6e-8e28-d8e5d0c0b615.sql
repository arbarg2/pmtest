CREATE TABLE public.malicious_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'malicious',
  label TEXT,
  source TEXT NOT NULL DEFAULT 'community',
  source_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (network, address, source)
);

CREATE INDEX idx_malicious_address_lower ON public.malicious_addresses (lower(address));
CREATE INDEX idx_malicious_network ON public.malicious_addresses (network);
CREATE INDEX idx_malicious_category ON public.malicious_addresses (category);

GRANT SELECT ON public.malicious_addresses TO anon;
GRANT SELECT ON public.malicious_addresses TO authenticated;
GRANT ALL ON public.malicious_addresses TO service_role;

ALTER TABLE public.malicious_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read malicious addresses"
ON public.malicious_addresses FOR SELECT
USING (true);

CREATE TRIGGER trg_malicious_updated_at
BEFORE UPDATE ON public.malicious_addresses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();