import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "unwatch_wallet",
  title: "Stop watching a wallet",
  description: "Remove a wallet address from the signed-in analyst's monitoring list.",
  inputSchema: {
    wallet_address: z.string().trim().min(4).describe("Wallet address to stop monitoring."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ wallet_address }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("watched_wallets")
      .delete()
      .eq("user_id", ctx.getUserId())
      .ilike("wallet_address", wallet_address)
      .select("wallet_address, network");

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const removed = data ?? [];
    return {
      content: [
        {
          type: "text",
          text: removed.length
            ? `Stopped monitoring ${wallet_address}.`
            : `No monitored wallet found matching ${wallet_address}.`,
        },
      ],
      structuredContent: { removed: removed.length, wallets: removed },
    };
  },
});
