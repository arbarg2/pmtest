import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_alerts",
  title: "List monitoring alerts",
  description:
    "List recent risk alerts raised on the signed-in analyst's monitored wallets, newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max alerts to return (default 20)."),
    unread_only: z.boolean().optional().describe("Only return alerts that have not been read."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, unread_only }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("watch_alerts")
      .select(
        "id, alert_type, alert_message, old_value, new_value, risk_change, is_read, created_at, watched_wallets!inner(wallet_address, network, user_id)",
      )
      .eq("watched_wallets.user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);

    if (unread_only) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const alerts = data ?? [];
    return {
      content: [
        {
          type: "text",
          text: alerts.length ? JSON.stringify(alerts, null, 2) : "No alerts found.",
        },
      ],
      structuredContent: { alerts },
    };
  },
});
