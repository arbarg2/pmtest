
-- Create table for detailed risk factors breakdown
CREATE TABLE public.risk_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lookup_record_id UUID REFERENCES public.investigation_records(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  score NUMERIC NOT NULL,
  description TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for sanctions screening results
CREATE TABLE public.sanctions_screening (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lookup_record_id UUID REFERENCES public.investigation_records(id) ON DELETE CASCADE,
  entity_name TEXT,
  entity_type TEXT,
  match_type TEXT CHECK (match_type IN ('direct', '1-hop')),
  confidence_score NUMERIC,
  source_list TEXT,
  screening_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for watched wallets
CREATE TABLE public.watched_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL,
  watch_reason TEXT,
  initial_risk_score NUMERIC,
  current_risk_score NUMERIC,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'removed')),
  alert_threshold NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, wallet_address, network)
);

-- Create table for watch alerts
CREATE TABLE public.watch_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watched_wallet_id UUID REFERENCES public.watched_wallets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  risk_change NUMERIC,
  alert_message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add analyst fields to investigation_records if not exists
ALTER TABLE public.investigation_records 
ADD COLUMN IF NOT EXISTS analyst_notes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS investigation_status TEXT DEFAULT 'pending' CHECK (investigation_status IN ('pending', 'escalated', 'cleared', 'blocked')),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS analyst_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions_screening ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watched_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for risk_factors
CREATE POLICY "Users can view risk factors for their records" 
  ON public.risk_factors FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.investigation_records ir WHERE ir.id = lookup_record_id AND ir.user_id = auth.uid()));

CREATE POLICY "Users can create risk factors for their records" 
  ON public.risk_factors FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigation_records ir WHERE ir.id = lookup_record_id AND ir.user_id = auth.uid()));

-- RLS policies for sanctions_screening
CREATE POLICY "Users can view sanctions screening for their records" 
  ON public.sanctions_screening FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.investigation_records ir WHERE ir.id = lookup_record_id AND ir.user_id = auth.uid()));

CREATE POLICY "Users can create sanctions screening for their records" 
  ON public.sanctions_screening FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigation_records ir WHERE ir.id = lookup_record_id AND ir.user_id = auth.uid()));

-- RLS policies for watched_wallets
CREATE POLICY "Users can view their own watched wallets" 
  ON public.watched_wallets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watched wallets" 
  ON public.watched_wallets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watched wallets" 
  ON public.watched_wallets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watched wallets" 
  ON public.watched_wallets FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for watch_alerts
CREATE POLICY "Users can view alerts for their watched wallets" 
  ON public.watch_alerts FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.watched_wallets ww WHERE ww.id = watched_wallet_id AND ww.user_id = auth.uid()));

CREATE POLICY "System can create watch alerts" 
  ON public.watch_alerts FOR INSERT 
  WITH CHECK (true);

-- Function to check for sanctioned entities (mock implementation)
CREATE OR REPLACE FUNCTION public.screen_sanctions(wallet_address TEXT, network TEXT DEFAULT 'bitcoin')
RETURNS TABLE (
  entity_name TEXT,
  entity_type TEXT,
  match_type TEXT,
  confidence_score NUMERIC,
  source_list TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mock sanctions screening - replace with real API integration
  -- This is a placeholder that returns sample data for demo purposes
  
  -- Simulate some sanctioned addresses for demo
  IF wallet_address ILIKE '%1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa%' THEN
    RETURN QUERY SELECT 
      'Genesis Block Address'::TEXT,
      'Historical'::TEXT,
      'direct'::TEXT,
      0.95::NUMERIC,
      'Demo List'::TEXT;
  END IF;
  
  -- Return empty result for clean addresses
  RETURN;
END;
$$;

-- Function to calculate detailed risk factors
CREATE OR REPLACE FUNCTION public.calculate_risk_factors(
  wallet_data JSONB
) 
RETURNS TABLE (
  factor_type TEXT,
  severity TEXT,
  score NUMERIC,
  description TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  transaction_count INTEGER;
  volume_usd NUMERIC;
  entity_type TEXT;
BEGIN
  -- Extract values from wallet data
  transaction_count := COALESCE((wallet_data->>'transaction_count')::INTEGER, 0);
  volume_usd := COALESCE((wallet_data->'volume_metrics'->'lifetime_value'->>'usd_equivalent')::NUMERIC, 0);
  entity_type := COALESCE(wallet_data->'entity_attribution'->>'type', 'unknown');
  
  -- High frequency transactions check
  IF transaction_count > 1000 THEN
    RETURN QUERY SELECT 
      'high_frequency_transactions'::TEXT,
      'high'::TEXT,
      0.8::NUMERIC,
      format('Wallet has %s transactions, indicating high activity', transaction_count)::TEXT;
  ELSIF transaction_count > 100 THEN
    RETURN QUERY SELECT 
      'high_frequency_transactions'::TEXT,
      'medium'::TEXT,
      0.4::NUMERIC,
      format('Wallet has %s transactions, showing moderate activity', transaction_count)::TEXT;
  END IF;
  
  -- Suspicious volume check
  IF volume_usd > 1000000 THEN
    RETURN QUERY SELECT 
      'suspicious_volume'::TEXT,
      'high'::TEXT,
      0.7::NUMERIC,
      format('Total volume of $%s exceeds normal patterns', volume_usd)::TEXT;
  ELSIF volume_usd > 100000 THEN
    RETURN QUERY SELECT 
      'suspicious_volume'::TEXT,
      'medium'::TEXT,
      0.4::NUMERIC,
      format('Total volume of $%s requires monitoring', volume_usd)::TEXT;
  END IF;
  
  -- Entity type risk assessment
  IF entity_type IN ('mixer', 'tumbler', 'privacy_coin') THEN
    RETURN QUERY SELECT 
      'mixer_proximity'::TEXT,
      'high'::TEXT,
      0.9::NUMERIC,
      format('Wallet identified as %s service', entity_type)::TEXT;
  ELSIF entity_type IN ('exchange', 'custodial') THEN
    RETURN QUERY SELECT 
      'exchange_risk'::TEXT,
      'low'::TEXT,
      0.1::NUMERIC,
      format('Wallet belongs to %s service', entity_type)::TEXT;
  END IF;
  
  RETURN;
END;
$$;
