
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Investigation records
CREATE TABLE public.investigation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'Low',
  analysis_data JSONB,
  analyst_notes TEXT DEFAULT '',
  investigation_status TEXT DEFAULT 'pending',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ai_summary TEXT,
  ai_summary_status TEXT DEFAULT 'pending',
  ai_summary_generated_at TIMESTAMPTZ,
  ai_summary_previous TEXT,
  is_case BOOLEAN NOT NULL DEFAULT false,
  case_id TEXT UNIQUE,
  case_status TEXT,
  case_created_at TIMESTAMPTZ,
  assigned_to UUID,
  analyst_id UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investigation_records_user ON public.investigation_records(user_id);
CREATE INDEX idx_investigation_records_record_id ON public.investigation_records(record_id);
CREATE INDEX idx_investigation_records_case ON public.investigation_records(is_case, case_id);

-- Generate record_id trigger
CREATE OR REPLACE FUNCTION public.generate_record_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  date_part TEXT;
  seq_num INT;
BEGIN
  IF NEW.record_id IS NULL OR NEW.record_id = '' THEN
    date_part := to_char(now(), 'YYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(record_id FROM 'LR_' || date_part || '_(\d+)') AS INT)), 0) + 1
      INTO seq_num
      FROM public.investigation_records
      WHERE record_id LIKE 'LR_' || date_part || '_%';
    new_id := 'LR_' || date_part || '_' || LPAD(seq_num::TEXT, 3, '0');
    NEW.record_id := new_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_record_id BEFORE INSERT ON public.investigation_records
  FOR EACH ROW EXECUTE FUNCTION public.generate_record_id();

-- Generate case_id RPC
CREATE OR REPLACE FUNCTION public.generate_case_id()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  date_part TEXT;
  seq_num INT;
BEGIN
  date_part := to_char(now(), 'YYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_id FROM 'CASE_' || date_part || '_(\d+)') AS INT)), 0) + 1
    INTO seq_num
    FROM public.investigation_records
    WHERE case_id LIKE 'CASE_' || date_part || '_%';
  RETURN 'CASE_' || date_part || '_' || LPAD(seq_num::TEXT, 3, '0');
END;
$$;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_investigation_records_updated BEFORE UPDATE ON public.investigation_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Risk factors
CREATE TABLE public.risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_record_id UUID NOT NULL REFERENCES public.investigation_records(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  score NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_factors_record ON public.risk_factors(lookup_record_id);

-- Sanctions screening
CREATE TABLE public.sanctions_screening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_record_id UUID NOT NULL REFERENCES public.investigation_records(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  entity_type TEXT,
  match_type TEXT NOT NULL DEFAULT 'direct',
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  source_list TEXT,
  screening_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sanctions_record ON public.sanctions_screening(lookup_record_id);

-- Watched wallets
CREATE TABLE public.watched_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL,
  watch_reason TEXT,
  initial_risk_score NUMERIC,
  current_risk_score NUMERIC,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  alert_threshold NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_watched_wallets_user ON public.watched_wallets(user_id);

CREATE TRIGGER trg_watched_wallets_updated BEFORE UPDATE ON public.watched_wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Watch alerts
CREATE TABLE public.watch_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watched_wallet_id UUID NOT NULL REFERENCES public.watched_wallets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  risk_change NUMERIC,
  alert_message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_watch_alerts_wallet ON public.watch_alerts(watched_wallet_id);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  record_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions_screening ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watched_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Investigation records policies
CREATE POLICY "Users view own records" ON public.investigation_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own records" ON public.investigation_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own records" ON public.investigation_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own records" ON public.investigation_records FOR DELETE USING (auth.uid() = user_id);

-- Risk factors policies (via parent record ownership)
CREATE POLICY "Users view own risk factors" ON public.risk_factors FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.investigation_records r WHERE r.id = lookup_record_id AND r.user_id = auth.uid()));
CREATE POLICY "Users insert own risk factors" ON public.risk_factors FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigation_records r WHERE r.id = lookup_record_id AND r.user_id = auth.uid()));

-- Sanctions screening policies
CREATE POLICY "Users view own sanctions" ON public.sanctions_screening FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.investigation_records r WHERE r.id = lookup_record_id AND r.user_id = auth.uid()));
CREATE POLICY "Users insert own sanctions" ON public.sanctions_screening FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigation_records r WHERE r.id = lookup_record_id AND r.user_id = auth.uid()));

-- Watched wallets policies
CREATE POLICY "Users view own watched" ON public.watched_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own watched" ON public.watched_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own watched" ON public.watched_wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own watched" ON public.watched_wallets FOR DELETE USING (auth.uid() = user_id);

-- Watch alerts policies
CREATE POLICY "Users view own alerts" ON public.watch_alerts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.watched_wallets w WHERE w.id = watched_wallet_id AND w.user_id = auth.uid()));
CREATE POLICY "Users update own alerts" ON public.watch_alerts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.watched_wallets w WHERE w.id = watched_wallet_id AND w.user_id = auth.uid()));
CREATE POLICY "System insert alerts" ON public.watch_alerts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.watched_wallets w WHERE w.id = watched_wallet_id AND w.user_id = auth.uid()));

-- Audit log policies
CREATE POLICY "Users view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
