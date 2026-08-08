import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_investigations",
  title: "List investigations",
  description:
    "List the signed-in analyst's recent wallet investigation records, newest first, with risk score and level.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max records to return (default 10)."),
    risk_level: z
      .enum(["low", "medium", "high", "critical"])
      .optional()
      .describe("Filter by risk level."),
    search: z.string().trim().min(3).optional().describe("Filter by wallet address substring."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, risk_level, search }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("investigation_records")
      .select(
        "id, record_id, wallet_address, network, risk_score, risk_level, investigation_status, is_case, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);

    if (risk_level) query = query.eq("risk_level", risk_level);
    if (search) query = query.ilike("wallet_address", `%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { records: data ?? [] },
    };
  },
});
