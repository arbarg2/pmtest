
-- ============ WORKSPACES ============
CREATE TYPE public.workspace_role AS ENUM ('owner','compliance_officer','analyst','legal','viewer');

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.workspace_role NOT NULL DEFAULT 'analyst',
  invited_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = _workspace_id AND m.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(_workspace_id uuid, _user_id uuid, _roles public.workspace_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = _workspace_id AND m.user_id = _user_id AND m.role = ANY(_roles))
$$;

CREATE POLICY "Members view workspaces" ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "Users create workspaces" ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins update workspaces" ON public.workspaces FOR UPDATE TO authenticated
  USING (public.has_workspace_role(id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]))
  WITH CHECK (public.has_workspace_role(id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]));

CREATE POLICY "Members view members" ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins add members" ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.workspace_members m2 WHERE m2.workspace_id = workspace_members.workspace_id)
    OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[])
  );
CREATE POLICY "Admins update members" ON public.workspace_members FOR UPDATE TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]));
CREATE POLICY "Admins remove members" ON public.workspace_members FOR DELETE TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner']::public.workspace_role[]));

CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_workspace_members_updated BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RULESETS ============
CREATE TABLE public.rulesets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  definition jsonb NOT NULL,
  definition_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rulesets TO authenticated, anon;
GRANT ALL ON public.rulesets TO service_role;
ALTER TABLE public.rulesets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads rulesets" ON public.rulesets FOR SELECT USING (true);

-- ============ SCREENING DECISIONS (append-only) ============
CREATE TABLE public.screening_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id uuid,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'app',
  address text NOT NULL,
  network text NOT NULL,
  verdict text NOT NULL,
  risk_score numeric NOT NULL DEFAULT 0,
  ruleset_version text NOT NULL DEFAULT 'unknown',
  ruleset_hash text,
  policy_id uuid,
  block_height bigint,
  entity_category text,
  rules_evaluated jsonb NOT NULL DEFAULT '[]'::jsonb,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_payloads jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_hash text,
  sanctions_snapshot_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_screening_decisions_address ON public.screening_decisions (lower(address), created_at DESC);
CREATE INDEX idx_screening_decisions_ws ON public.screening_decisions (workspace_id, created_at DESC);
GRANT SELECT ON public.screening_decisions TO authenticated;
GRANT SELECT, INSERT ON public.screening_decisions TO service_role;
ALTER TABLE public.screening_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or workspace members read decisions" ON public.screening_decisions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())));

-- ============ ENTITY ATTRIBUTIONS ============
CREATE TABLE public.entity_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  network text NOT NULL,
  address text NOT NULL,
  entity_name text NOT NULL,
  entity_category text NOT NULL,
  confidence numeric NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'curated',
  verified_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_entity_attr_unique ON public.entity_attributions (network, lower(address), COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT ON public.entity_attributions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_attributions TO authenticated;
GRANT ALL ON public.entity_attributions TO service_role;
ALTER TABLE public.entity_attributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads global attributions" ON public.entity_attributions FOR SELECT
  USING (workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace admins write attributions" ON public.entity_attributions FOR INSERT TO authenticated
  WITH CHECK (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer','analyst']::public.workspace_role[]));
CREATE POLICY "Workspace admins update attributions" ON public.entity_attributions FOR UPDATE TO authenticated
  USING (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]))
  WITH CHECK (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]));
CREATE POLICY "Workspace admins delete attributions" ON public.entity_attributions FOR DELETE TO authenticated
  USING (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]));
CREATE TRIGGER trg_entity_attr_updated BEFORE UPDATE ON public.entity_attributions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RISK POLICIES (versioned, immutable rows) ============
CREATE TABLE public.risk_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default policy',
  version integer NOT NULL DEFAULT 1,
  caution_threshold numeric NOT NULL DEFAULT 35,
  danger_threshold numeric NOT NULL DEFAULT 70,
  rule_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  category_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  blocked_categories text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name, version)
);
GRANT SELECT, INSERT ON public.risk_policies TO authenticated;
GRANT ALL ON public.risk_policies TO service_role;
ALTER TABLE public.risk_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read policies" ON public.risk_policies FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins create policy versions" ON public.risk_policies FOR INSERT TO authenticated
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]));

-- ============ SAR DRAFTS ============
CREATE TABLE public.sar_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  record_id uuid REFERENCES public.investigation_records(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  address text,
  network text,
  narrative text NOT NULL,
  evidence_bundle jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sar_drafts TO authenticated;
GRANT ALL ON public.sar_drafts TO service_role;
ALTER TABLE public.sar_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized read sar drafts" ON public.sar_drafts FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer','legal']::public.workspace_role[])));
CREATE POLICY "Authors create sar drafts" ON public.sar_drafts FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid())));
CREATE POLICY "Authors update sar drafts" ON public.sar_drafts FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[])))
  WITH CHECK (created_by = auth.uid() OR (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[])));
CREATE TRIGGER trg_sar_drafts_updated BEFORE UPDATE ON public.sar_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ WEBHOOKS ============
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  url text NOT NULL,
  description text,
  secret_hash text NOT NULL,
  secret_prefix text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['risk_change','case_escalation','sanctions_hit']::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;
GRANT ALL ON public.webhook_endpoints TO service_role;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage webhooks" ON public.webhook_endpoints FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[]));
CREATE TRIGGER trg_webhook_endpoints_updated BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature text,
  status_code integer,
  error text,
  attempt integer NOT NULL DEFAULT 1,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read deliveries" ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.webhook_endpoints e
    WHERE e.id = webhook_deliveries.endpoint_id
      AND public.has_workspace_role(e.workspace_id, auth.uid(), ARRAY['owner','compliance_officer']::public.workspace_role[])));

-- ============ workspace_id on existing tables ============
ALTER TABLE public.investigation_records ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.watched_wallets ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- additive workspace read/write access alongside existing owner policies
CREATE POLICY "Workspace members view records" ON public.investigation_records FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace editors update records" ON public.investigation_records FOR UPDATE TO authenticated
  USING (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer','analyst']::public.workspace_role[]))
  WITH CHECK (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','compliance_officer','analyst']::public.workspace_role[]));
CREATE POLICY "Workspace members view watched" ON public.watched_wallets FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()));

-- ============ backfill personal workspaces ============
INSERT INTO public.workspaces (name, created_by)
SELECT COALESCE(p.full_name, split_part(p.email, '@', 1), 'Personal') || '''s workspace', p.id
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.workspace_members m WHERE m.user_id = p.id);

INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT w.id, w.created_by, 'owner'::public.workspace_role
FROM public.workspaces w
ON CONFLICT (workspace_id, user_id) DO NOTHING;

UPDATE public.investigation_records r SET workspace_id = w.id
FROM public.workspaces w WHERE w.created_by = r.user_id AND r.workspace_id IS NULL;
UPDATE public.watched_wallets t SET workspace_id = w.id
FROM public.workspaces w WHERE w.created_by = t.user_id AND t.workspace_id IS NULL;
UPDATE public.api_keys k SET workspace_id = w.id
FROM public.workspaces w WHERE w.created_by = k.user_id AND k.workspace_id IS NULL;

INSERT INTO public.risk_policies (workspace_id, name, version, created_by)
SELECT w.id, 'Default policy', 1, w.created_by FROM public.workspaces w
ON CONFLICT DO NOTHING;

-- new users get a personal workspace automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ws_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.workspaces (name, created_by)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Personal') || '''s workspace', NEW.id)
  RETURNING id INTO ws_id;
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, NEW.id, 'owner'::public.workspace_role)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.risk_policies (workspace_id, name, version, created_by)
  VALUES (ws_id, 'Default policy', 1, NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- seed the initial ruleset
INSERT INTO public.rulesets (version, definition, definition_hash, is_active, notes)
VALUES ('1.0.0', '{"rules":[
  {"id":"sanctions_direct","score":100,"severity":"high"},
  {"id":"fresh_wallet","score":45,"severity":"medium"},
  {"id":"low_activity","score":30,"severity":"medium"},
  {"id":"new_age","score":40,"severity":"medium"},
  {"id":"sweeper_pattern","score":55,"severity":"medium"},
  {"id":"mixer_counterparty","score":75,"severity":"high"},
  {"id":"baseline","score":5,"severity":"low"}
],"thresholds":{"caution":35,"danger":70}}'::jsonb, 'genesis', true, 'Initial published ruleset');
