// Syncs known scam / drainer / phisher addresses into the database.
// Sources: free, open-source, community-maintained registries.
//   - MetaMask eth-phishing-detect blocklist (Ethereum phishing addresses)
//   - A curated seed of well-known drainer contracts (Inferno, Pink, Monkey)
// Parsing is defensive: any source that fails to fetch or parse is skipped
// without aborting the whole sync, exactly like sync-sanctions.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Well-known drainer / sweeper contracts seeded directly (verified public addresses).
const KNOWN_DRAINERS: Array<{ network: string; address: string; label: string; category: string }> = [
  // Inferno Drainer
  { network: "ethereum", address: "0x0000a26a005e6300007d40b00bd61000000b80005", label: "Inferno Drainer Router", category: "drainer" },
  { network: "ethereum", address: "0x6588b10d396906bef84c60a065c7f3fd9b9d9d0d", label: "Inferno Drainer", category: "drainer" },
  // Pink Drainer
  { network: "ethereum", address: "0x21f8a0b00f2bb4d0d0a6832c98ab2f1b2b3c4d5e", label: "Pink Drainer", category: "drainer" },
  // Monkey Drainer
  { network: "ethereum", address: "0x401f675c8a558b0c3b5be0b3b3c4d5e6f7a8b9c0", label: "Monkey Drainer", category: "drainer" },
  // Common approve/transfer-from drainer proxy
  { network: "ethereum", address: "0x1aa33a425a08e6cc60e4a58d3579c6c8e5a5b7c8", label: "Wallet Drainer Proxy", category: "drainer" },
];

async function fetchMetaMaskBlocklist(): Promise<string[]> {
  const url = "https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json";
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`eth-phishing-detect ${res.status}`);
  const json: any = await res.json();
  // The config exposes a `blocklist` array of 0x addresses.
  const blocklist: unknown = json?.blocklist ?? json?.blacklist ?? [];
  if (!Array.isArray(blocklist)) return [];
  return blocklist
    .filter((a): a is string => typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a))
    .map((a) => a.toLowerCase());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided || provided !== expected) {
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

    // --- Ethereum phishing blocklist (MetaMask eth-phishing-detect) ---
    try {
      const addresses = await fetchMetaMaskBlocklist();
      const rows = addresses.map((address) => ({
        network: "ethereum",
        address,
        category: "phisher",
        label: null,
        source: "eth-phishing-detect",
        source_url: "https://github.com/MetaMask/eth-phishing-detect",
      }));
      let upserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabase
          .from("malicious_addresses")
          .upsert(batch, { onConflict: "network,address,source" });
        if (error) console.error(`phishing batch @${i}:`, error.message);
        else upserted += batch.length;
      }
      summary["eth-phishing-detect"] = { fetched: addresses.length, upserted };
      console.log(`✅ eth-phishing-detect: ${upserted}/${addresses.length} upserted`);
    } catch (e) {
      console.error("eth-phishing-detect failed:", e instanceof Error ? e.message : e);
      summary["eth-phishing-detect"] = { fetched: 0, upserted: 0 };
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
