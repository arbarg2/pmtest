CREATE TABLE public.agent_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  record_id uuid REFERENCES public.investigation_records(id) ON DELETE SET NULL,
  created_by uuid,
  source text NOT NULL DEFAULT 'app',
  root_address text NOT NULL,
  network text NOT NULL,
  trigger_reason text,
  status text NOT NULL DEFAULT 'queued',
  depth_limit int NOT NULL DEFAULT 3,
  node_budget int NOT NULL DEFAULT 24,
  nodes_done int NOT NULL DEFAULT 0,
  runs int NOT NULL DEFAULT 0,
  max_downstream_risk numeric,
  narrative text,
  narrative_validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  lease_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_trace_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL REFERENCES public.agent_traces(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.agent_trace_nodes(id) ON DELETE CASCADE,
  address text NOT NULL,
  network text NOT NULL,
  depth int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  verdict text,
  risk_score numeric,
  entity_name text,
  entity_category text,
  classification text,
  labels jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  edge jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX agent_trace_nodes_unique_addr ON public.agent_trace_nodes (trace_id, lower(address));
CREATE INDEX agent_trace_nodes_trace_idx ON public.agent_trace_nodes (trace_id, status, depth);
CREATE INDEX agent_traces_status_idx ON public.agent_traces (status, created_at);
CREATE INDEX agent_traces_addr_idx ON public.agent_traces (lower(root_address), created_at DESC);

CREATE TABLE public.agent_job_state (
  job text PRIMARY KEY,
  status text NOT NULL DEFAULT 'active',
  reason text,
  paused_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.agent_job_state (job, status) VALUES ('trace_agent', 'active')
ON CONFLICT (job) DO NOTHING;

GRANT SELECT ON public.agent_traces TO authenticated;
GRANT ALL ON public.agent_traces TO service_role;
GRANT SELECT ON public.agent_trace_nodes TO authenticated;
GRANT ALL ON public.agent_trace_nodes TO service_role;
GRANT ALL ON public.agent_job_state TO service_role;

ALTER TABLE public.agent_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_trace_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_job_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own or workspace traces"
ON public.agent_traces FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.investigation_records r
    WHERE r.id = agent_traces.record_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users read nodes of visible traces"
ON public.agent_trace_nodes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agent_traces t
    WHERE t.id = agent_trace_nodes.trace_id
      AND (
        t.created_by = auth.uid()
        OR (t.workspace_id IS NOT NULL AND public.is_workspace_member(t.workspace_id, auth.uid()))
        OR EXISTS (
          SELECT 1 FROM public.investigation_records r
          WHERE r.id = t.record_id AND r.user_id = auth.uid()
        )
      )
  )
);

CREATE TRIGGER trg_agent_traces_updated BEFORE UPDATE ON public.agent_traces
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_agent_trace_nodes_updated BEFORE UPDATE ON public.agent_trace_nodes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$
BEGIN
  PERFORM cron.unschedule('trace-agent-worker');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'trace-agent-worker',
  '*/5 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://nqjorzsehawucorvaqyi.supabase.co/functions/v1/trace-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret' LIMIT 1)
    ),
    body := '{"action":"run","scheduled":true}'::jsonb
  );
  $job$
);