// Syncs known scam / drainer / phisher addresses into the database.
// Sources: free, open-source, community-maintained registries.
//   - Etherscan public phishing/hack name-tags (dawsbot/evm-labels) — real addresses
//   - A curated seed of well-known drainer / hack contracts (Inferno, Pink, Angel...)
// Parsing is defensive: any source that fails to fetch or parse is skipped
// without aborting the whole sync, exactly like sync-sanctions.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verified, publicly-documented drainer / scam contracts (each source-checkable on Etherscan).
const KNOWN_DRAINERS: Array<{ network: string; address: string; label: string; category: string }> = [
  { network: "ethereum", address: "0x0000daf60a1becf1bd617c584dea964455890000", label: "Inferno Drainer Phishing Contract", category: "drainer" },
  { network: "ethereum", address: "0x00000f312c54d0dd25888ee9cdc3dee988700000", label: "Pink Drainer", category: "drainer" },
  { network: "ethereum", address: "0x0000c3ace9e31a26ce1870d418cb045d73b30000", label: "Angel Drainer Phishing Contract", category: "drainer" },
  { network: "ethereum", address: "0x0000d38a234679f88dd6343d34e26dcb50c30000", label: "Angel Drainer", category: "drainer" },
  { network: "ethereum", address: "0x533db465afbeea29fd6f2d6acadb2e2d0cee7e46", label: "Angel Drainer Deployer", category: "drainer" },
  { network: "ethereum", address: "0x9f26ae5cd245bfeeb5926d61497550f79d9c6c1c", label: "Akropolis Hacker 1", category: "hack" },
  { network: "ethereum", address: "0xbceaa0040764009fdcff407e82ad1f06465fd2c4", label: "Bancor Hacker", category: "hack" },
  { network: "ethereum", address: "0xeda5066780de29d00dfb54581a707ef6f52d8113", label: "ChainSwap Hacker", category: "hack" },
];

// Etherscan's own public phishing/hack name-tags, compiled by dawsbot/evm-labels.
// These are real on-chain addresses (not domains) with Etherscan-verified labels.
const LABELS_URL = "https://raw.githubusercontent.com/dawsbot/evm-labels/master/src/mainnet/phish-hack/all.csv";

async function fetchEtherscanLabels(): Promise<Array<{ address: string; label: string | null; category: string }>> {
  const res = await fetch(LABELS_URL, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`evm-labels ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n").slice(1); // drop header
  const out: Array<{ address: string; label: string | null; category: string }> = [];
  for (const line of lines) {
    const idx = line.indexOf(",");
    if (idx < 0) continue;
    const address = line.slice(0, idx).trim().toLowerCase();
    const tag = line.slice(idx + 1).trim();
    if (!/^0x[a-f0-9]{40}$/.test(address)) continue;
    const tl = tag.toLowerCase();
    const category = tl.includes("drainer")
      ? "drainer"
      : tl.includes("hacker") || tl.includes("hack")
      ? "hack"
      : tl.includes("phishing")
      ? "phishing"
      : "scam";
    out.push({ address, label: tag || null, category });
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const expected = Deno.env.get("CRON_SECRET") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const provided = req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  // Accept either the dedicated cron secret or the (public) anon key — the function
  // only syncs public community blocklist data, so anon-key gating is sufficient.
  if (!provided || (expected && provided !== expected && provided !== anon)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const summary: Record<string, { fetched: number; upserted: number }> = {};

    // --- Etherscan public phishing/hack name-tags (dawsbot/evm-labels) ---
    try {
      const entries = await fetchEtherscanLabels();
      const rows = entries.map((e) => ({
        network: "ethereum",
        address: e.address,
        category: e.category,
        label: e.label,
        source: "Etherscan name-tags (dawsbot/evm-labels)",
        source_url: LABELS_URL,
      }));
      let upserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabase
          .from("malicious_addresses")
          .upsert(batch, { onConflict: "network,address,source" });
        if (error) console.error(`labels batch @${i}:`, error.message);
        else upserted += batch.length;
      }
      summary["evm-labels"] = { fetched: entries.length, upserted };
      console.log(`✅ evm-labels: ${upserted}/${entries.length} upserted`);
    } catch (e) {
      console.error("evm-labels failed:", e instanceof Error ? e.message : e);
      summary["evm-labels"] = { fetched: 0, upserted: 0 };
    }

    // --- Curated drainer seed (always upserted) ---
    try {
      const rows = KNOWN_DRAINERS.map((d) => ({
        network: d.network,
        address: d.address.toLowerCase(),
        category: d.category,
        label: d.label,
        source: "curated-drainers",
        source_url: null,
      }));
      const { error } = await supabase
        .from("malicious_addresses")
        .upsert(rows, { onConflict: "network,address,source" });
      summary["curated-drainers"] = { fetched: rows.length, upserted: error ? 0 : rows.length };
      if (error) console.error("curated-drainers:", error.message);
      else console.log(`✅ curated-drainers: ${rows.length} upserted`);
    } catch (e) {
      console.error("curated-drainers failed:", e);
      summary["curated-drainers"] = { fetched: KNOWN_DRAINERS.length, upserted: 0 };
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sync-malicious error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
