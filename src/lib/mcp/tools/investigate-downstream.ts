import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "investigate_downstream",
  title: "Start autonomous downstream investigation",
  description:
    "Launch the autonomous forensic agent on a wallet address. It recursively walks downstream fund flows (up to 3 hops), screens every hop against sanctions/scam/attribution data, classifies unknown smart contracts from on-chain bytecode, and drafts a cited investigative narrative. Returns the trace id; poll `get_investigation_trace` for results.",
  inputSchema: {
    address: z.string().trim().min(4).describe("Root wallet address to investigate."),
    depth_limit: z.number().int().min(1).max(3).optional().describe("Hops to walk downstream (default 3)."),
    reason: z.string().max(300).optional().describe("Why this investigation was started."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  handler: async ({ address, depth_limit, reason }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.functions.invoke("trace-agent", {
      body: {
        action: "enqueue",
        address,
        depth_limit: depth_limit ?? 3,
        source: "mcp",
        trigger_reason: reason ?? "Requested via MCP",
      },
    });
    if (error) return { content: [{ type: "text", text: `Failed to start: ${error.message}` }], isError: true };
    if ((data as any)?.error) return { content: [{ type: "text", text: String((data as any).error) }], isError: true };

    return {
      content: [{
        type: "text",
        text: `Autonomous investigation ${(data as any).reused ? "already running" : "started"} for ${address}. Trace id: ${(data as any).id}`,
      }],
      structuredContent: data as Record<string, unknown>,
    };
  },
});
