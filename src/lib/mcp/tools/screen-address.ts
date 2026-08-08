import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "screen_address",
  title: "Screen address against sanctions",
  description:
    "Screen a crypto wallet address against the synced OFAC sanctions address list and report any direct matches.",
  inputSchema: {
    address: z.string().trim().min(4).describe("The wallet address to screen."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ address }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("sanctions_addresses")
      .select("address, entity_name, source_list, program, network, date_listed")
      .ilike("address", address)
      .limit(10);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const hits = data ?? [];
    const text = hits.length
      ? `SANCTIONS MATCH for ${address}:\n${JSON.stringify(hits, null, 2)}`
      : `No direct sanctions match found for ${address}.`;

    return {
      content: [{ type: "text", text }],
      structuredContent: { address, sanctioned: hits.length > 0, hits },
    };
  },
});
