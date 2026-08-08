import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_watched_wallets",
  title: "List watched wallets",
  description: "List wallets the signed-in analyst is monitoring, with current and initial risk scores.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max wallets to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("watched_wallets")
      .select(
        "id, wallet_address, network, status, watch_reason, alert_threshold, initial_risk_score, current_risk_score, last_checked",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { wallets: data ?? [] },
    };
  },
});
