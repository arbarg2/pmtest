-- Sanctions addresses table (OFAC SDN + others)
CREATE TABLE public.sanctions_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  source_list TEXT NOT NULL DEFAULT 'OFAC_SDN',
  entity_name TEXT,
  program TEXT,
  date_listed DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (network, address, source_list)
);

CREATE INDEX idx_sanctions_address_lower ON public.sanctions_addresses (lower(address));
CREATE INDEX idx_sanctions_network ON public.sanctions_addresses (network);

ALTER TABLE public.sanctions_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sanctions"
ON public.sanctions_addresses FOR SELECT
USING (true);

CREATE POLICY "Admins manage sanctions"
ON public.sanctions_addresses FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sanctions_updated_at
BEFORE UPDATE ON public.sanctions_addresses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Wallet cache table (TTL'd chain lookup results)
CREATE TABLE public.wallet_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (network, address)
);

CREATE INDEX idx_wallet_cache_lookup ON public.wallet_cache (network, lower(address));
CREATE INDEX idx_wallet_cache_expiry ON public.wallet_cache (expires_at);

ALTER TABLE public.wallet_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wallet cache"
ON public.wallet_cache FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert cache"
ON public.wallet_cache FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update cache"
ON public.wallet_cache FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);