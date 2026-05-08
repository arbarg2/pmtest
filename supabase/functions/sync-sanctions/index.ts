// Syncs OFAC sanctioned crypto addresses into the database.
// Source: U.S. Treasury OFAC SDN list — published as machine-readable XML.
// We use the community-maintained mirror of extracted crypto addresses for reliability.
// https://github.com/0xB10C/ofac-sanctioned-digital-currency-addresses
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOURCES: Array<{ network: string; url: string }> = [
  {
    network: "bitcoin",
    url: "https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_XBT.txt",
  },
  {
    network: "ethereum",
    url: "https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_ETH.txt",
  },
];

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

    for (const src of SOURCES) {
      const res = await fetch(src.url, {
        headers: { Accept: "text/plain" },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        console.error(`Failed to fetch ${src.network} list: ${res.status}`);
        summary[src.network] = { fetched: 0, upserted: 0 };
        continue;
      }
      const text = await res.text();
      const addresses = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      // Batch upsert in chunks of 500
      const rows = addresses.map((address) => ({
        network: src.network,
        address,
        source_list: "OFAC_SDN",
        entity_name: null,
        program: "SDN",
      }));

      let upserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabase
          .from("sanctions_addresses")
          .upsert(batch, { onConflict: "network,address,source_list" });
        if (error) {
          console.error(`Batch upsert error (${src.network} @${i}):`, error.message);
        } else {
          upserted += batch.length;
        }
      }

      summary[src.network] = { fetched: addresses.length, upserted };
      console.log(`✅ ${src.network}: ${upserted}/${addresses.length} upserted`);
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sync-sanctions error:", error);
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
