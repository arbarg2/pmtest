import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_investigation_trace",
  title: "Get autonomous investigation trace",
  description:
    "Read the result of an autonomous downstream investigation: status, every screened hop with its verdict, risk score, entity attribution and contract classification, and the cited investigative narrative once complete. Look up by trace id or by root wallet address.",
  inputSchema: {
    trace_id: z.string().uuid().optional().describe("The trace id returned by investigate_downstream."),
    address: z.string().trim().min(4).optional().describe("Root wallet address — returns the most recent trace."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ trace_id, address }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!trace_id && !address) {
      return { content: [{ type: "text", text: "Provide trace_id or address." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    let query = supabase.from("agent_traces").select("*").order("created_at", { ascending: false }).limit(1);
    query = trace_id ? query.eq("id", trace_id) : query.ilike("root_address", address!);
    const { data: traces, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const trace = traces?.[0];
    if (!trace) {
      return { content: [{ type: "text", text: "No autonomous trace found." }], isError: true };
    }

    const { data: nodes } = await supabase
      .from("agent_trace_nodes")
      .select("address, network, depth, status, verdict, risk_score, entity_name, entity_category, classification, labels, edge")
      .eq("trace_id", trace.id)
      .order("depth", { ascending: true });

    const payload = { trace, nodes: nodes ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload as unknown as Record<string, unknown>,
    };
  },
});
