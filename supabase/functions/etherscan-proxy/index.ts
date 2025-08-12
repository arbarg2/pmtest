
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Basic allowlist for supported Etherscan operations
const ALLOWED_ACTIONS = new Set([
  "balance",
  "txlist",
  "tokentx",
]);

function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // verify jwt is handled by Supabase (verify_jwt = true), we only proceed
    const { module, action, address, tag, startblock, endblock, page, offset, sort } = await req.json();

    if (module !== "account" || !ALLOWED_ACTIONS.has(action)) {
      return new Response(
        JSON.stringify({ error: "Unsupported module/action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidEthAddress(address)) {
      return new Response(
        JSON.stringify({ error: "Invalid Ethereum address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ETHERSCAN_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ETHERSCAN_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const base = "https://api.etherscan.io/v2/api";
    const params = new URLSearchParams({ chainid: "1", module, action, address });

    // Attach optional params per action
    if (action === "balance") {
      params.set("tag", tag ?? "latest");
    } else if (action === "txlist" || action === "tokentx") {
      params.set("startblock", String(startblock ?? 0));
      params.set("endblock", String(endblock ?? 99999999));
      params.set("page", String(page ?? 1));
      params.set("offset", String(offset ?? 25));
      params.set("sort", String(sort ?? "desc"));
    }

    params.set("apikey", apiKey);

    const url = `${base}?${params.toString()}`;

    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Rian-Blockchain-Intelligence/1.0",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });

    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("etherscan-proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
