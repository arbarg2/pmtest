
-- Fix the search_path security warnings for all database functions
-- This ensures the functions are secure against search_path manipulation attacks

-- Fix generate_case_id function
CREATE OR REPLACE FUNCTION public.generate_case_id()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  RETURN 'CASE_' || to_char(now(), 'YYMMDD') || '_' || LPAD(nextval('case_id_seq')::TEXT, 4, '0');
END;
$$;

-- Fix screen_sanctions function
CREATE OR REPLACE FUNCTION public.screen_sanctions(wallet_address text, network text DEFAULT 'bitcoin'::text)
RETURNS TABLE(entity_name text, entity_type text, match_type text, confidence_score numeric, source_list text)
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
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

-- Fix calculate_risk_factors function
CREATE OR REPLACE FUNCTION public.calculate_risk_factors(wallet_data jsonb)
RETURNS TABLE(factor_type text, severity text, score numeric, description text)
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
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

-- Fix generate_record_id function
CREATE OR REPLACE FUNCTION public.generate_record_id()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  RETURN 'LR_' || to_char(now(), 'YYMMDD') || '_' || LPAD(nextval('record_id_seq')::TEXT, 3, '0');
END;
$$;

-- Fix set_record_id function
CREATE OR REPLACE FUNCTION public.set_record_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.record_id IS NULL OR NEW.record_id = '' THEN
    NEW.record_id := generate_record_id();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
