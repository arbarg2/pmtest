DROP POLICY IF EXISTS "Users read their own or workspace traces" ON public.agent_traces;
DROP POLICY IF EXISTS "Users read nodes of visible traces" ON public.agent_trace_nodes;

CREATE POLICY "Users read their own or workspace traces"
ON public.agent_traces FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = agent_traces.workspace_id AND m.user_id = auth.uid()
  )
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
        OR EXISTS (
          SELECT 1 FROM public.workspace_members m
          WHERE m.workspace_id = t.workspace_id AND m.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.investigation_records r
          WHERE r.id = t.record_id AND r.user_id = auth.uid()
        )
      )
  )
);