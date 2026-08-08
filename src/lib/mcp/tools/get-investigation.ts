import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_investigation",
  title: "Get investigation",
  description:
    "Fetch one investigation record owned by the signed-in analyst, including its AI summary and analysis data. Look it up by record_id or by wallet address.",
  inputSchema: {
    record_id: z.string().trim().min(1).optional().describe("The record_id of the investigation."),
    wallet_address: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Wallet address to fetch the most recent investigation for."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ record_id, wallet_address }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!record_id && !wallet_address) {
      return {
        content: [{ type: "text", text: "Provide either record_id or wallet_address." }],
        isError: true,
      };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("investigation_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (record_id) query = query.eq("record_id", record_id);
    else query = query.ilike("wallet_address", wallet_address!);

    const { data, error } = await query.maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "No matching investigation found." }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { record: data },
    };
  },
});
