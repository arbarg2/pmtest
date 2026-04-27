// Server-side proxy for Etherscan V2 API.
// Keeps ETHERSCAN_API_KEY private — the client never sees it.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ETHERSCAN_BASE_URL = "https://api.etherscan.io/v2/api";
const ALLOWED_MODULES = new Set(["account", "stats", "contract", "transaction"]);
const ALLOWED_ACTIONS = new Set([
  "balance",
  "balancemulti",
  "txlist",
  "txlistinternal",
  "tokentx",
  "tokennfttx",
  "getminedblocks",
  "ethsupply",
  "ethprice",
  "getabi",
  "getsourcecode",
  "getstatus",
]);

const isValidEthAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ETHERSCAN_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Etherscan API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Require an authenticated user (uses anon key + caller's JWT)
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      module,
      action,
      address,
      chainid = 1,
      startblock = 0,
      endblock = 99999999,
      page = 1,
      offset = 25,
      sort = "desc",
      contractaddress,
    } = body ?? {};

    if (!ALLOWED_MODULES.has(module) || !ALLOWED_ACTIONS.has(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid module/action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (address && !isValidEthAddress(address)) {
      return new Response(
        JSON.stringify({ error: "Invalid Ethereum address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const params = new URLSearchParams({
      chainid: String(chainid),
      module,
      action,
      apikey: apiKey,
    });
    if (address) params.set("address", address);
    if (contractaddress && isValidEthAddress(contractaddress)) {
      params.set("contractaddress", contractaddress);
    }
    if (action === "balance") params.set("tag", "latest");
    if (["txlist", "txlistinternal", "tokentx", "tokennfttx"].includes(action)) {
      params.set("startblock", String(startblock));
      params.set("endblock", String(endblock));
      params.set("page", String(Math.max(1, Math.min(Number(page) || 1, 100))));
      params.set("offset", String(Math.max(1, Math.min(Number(offset) || 25, 100))));
      params.set("sort", sort === "asc" ? "asc" : "desc");
    }

    const upstream = await fetch(`${ETHERSCAN_BASE_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("etherscan-proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
