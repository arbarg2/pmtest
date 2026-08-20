// Shared enqueue helper for the autonomous investigation agent.
// Used by `trace-agent` (analyst-triggered) and by `safe-check` /
// `wallet-monitor` (automatic trigger on medium-to-high risk).
import { detectNetwork, type Network } from "./screening.ts";

export interface EnqueueArgs {
  address: string;
  network?: string | null;
  record_id?: string | null;
  workspace_id?: string | null;
  created_by?: string | null;
  source: string;
  trigger_reason?: string | null;
  depth_limit?: number;
}

/** Idempotent: reuses any trace created for the same root address in the last 6 hours. */
export async function enqueueTrace(admin: any, a: EnqueueArgs) {
  const address = a.address.trim();
  const network = (a.network as Network) ?? detectNetwork(address);
  if (!network) throw new Error("Unsupported address format");

  const { data: existing } = await admin
    .from("agent_traces")
    .select("id, status")
    .ilike("root_address", address)
    .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return { id: existing.id as string, reused: true, status: existing.status as string };

  const { data: trace, error } = await admin
    .from("agent_traces")
    .insert({
      workspace_id: a.workspace_id ?? null,
      record_id: a.record_id ?? null,
      created_by: a.created_by ?? null,
      source: a.source,
      root_address: address,
      network,
      trigger_reason: a.trigger_reason ?? null,
      depth_limit: Math.min(3, Math.max(1, a.depth_limit ?? 3)),
      status: "queued",
    })
    .select("id, status")
    .single();
  if (error) throw new Error(error.message);

  await admin.from("agent_trace_nodes").insert({
    trace_id: trace.id,
    address,
    network,
    depth: 0,
    status: "pending",
  });

  return { id: trace.id as string, reused: false, status: trace.status as string };
}

/** Fire-and-forget trigger used by automatic callers. Never throws. */
export async function maybeEnqueueTrace(admin: any, a: EnqueueArgs & { risk_score: number }) {
  try {
    if (a.risk_score < 35) return null;
    const state = await admin.from("agent_job_state").select("status").eq("job", "trace_agent").maybeSingle();
    if (state.data?.status === "paused") return null;
    return await enqueueTrace(admin, a);
  } catch (e) {
    console.warn("trace enqueue skipped", e instanceof Error ? e.message : e);
    return null;
  }
}
