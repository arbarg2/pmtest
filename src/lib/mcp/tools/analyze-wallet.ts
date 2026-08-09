import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "analyze_wallet",
  title: "Analyze wallet risk",
  description:
    "Run a full live risk analysis on a crypto wallet address (BTC, ETH or Solana): sanctions screening, on-chain activity, wallet age, and behavioural risk factors. Returns a verdict (safe/caution/danger) and a 0-100 risk score.",
  inputSchema: {
    address: z.string().trim().min(4).describe("The wallet address to analyze."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ address }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.functions.invoke("safe-check", {
      body: { address },
    });
    if (error) {
      return { content: [{ type: "text", text: `Analysis failed: ${error.message}` }], isError: true };
    }
    if (data?.error) {
      return { content: [{ type: "text", text: String(data.error) }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data,
    };
  },
});
