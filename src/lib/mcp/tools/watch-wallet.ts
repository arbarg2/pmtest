import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "watch_wallet",
  title: "Watch a wallet",
  description: "Add a wallet address to the signed-in analyst's monitoring list.",
  inputSchema: {
    wallet_address: z.string().trim().min(4).describe("Wallet address to monitor."),
    network: z
      .enum(["bitcoin", "ethereum", "solana"])
      .describe("Blockchain network for the address."),
    watch_reason: z.string().trim().max(500).optional().describe("Why this wallet is being monitored."),
    alert_threshold: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Risk score increase that should trigger an alert (default 10)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ wallet_address, network, watch_reason, alert_threshold }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("watched_wallets")
      .insert({
        user_id: ctx.getUserId(),
        wallet_address,
        network,
        watch_reason: watch_reason ?? null,
        alert_threshold: alert_threshold ?? 10,
      })
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Now monitoring ${wallet_address} on ${network}.` }],
      structuredContent: { wallet: data },
    };
  },
});
