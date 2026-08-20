import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { screenAndLog, detectNetwork } from "../_shared/screening.ts";
import { maybeEnqueueTrace } from "../_shared/trace-enqueue.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let address = (url.searchParams.get("address") ?? "").trim();
    if (!address && req.method === "POST") {
      try {
        const body = await req.json();
        address = String(body?.address ?? "").trim();
      } catch {
        // ignore malformed body
      }
    }
    if (!address) {
      return new Response(JSON.stringify({ error: "address required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const network = detectNetwork(address);
    if (!network) {
      return new Response(JSON.stringify({ error: "Unsupported address format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Screening-basis counts — surfaced on the verdict so users trust the result.
    const [sanCount, malCount] = await Promise.all([
      supabase.from("sanctions_addresses").select("*", { count: "exact", head: true }),
      supabase.from("malicious_addresses").select("*", { count: "exact", head: true }),
    ]);
    const evidence_basis = {
      sanctions_count: sanCount.count ?? 0,
      malicious_count: malCount.count ?? 0,
      screened_at: new Date().toISOString(),
    };

    // Cache hit (15 min)
    const { data: cached } = await supabase
      .from("public_checks")
      .select("*")
      .eq("network", network)
      .ilike("address", address)
      .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .maybeSingle();

    if (cached) {
      await supabase.from("public_checks").update({ view_count: (cached.view_count ?? 0) + 1 }).eq("id", cached.id);
      return new Response(JSON.stringify({ ...cached, cached: true, evidence_basis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await screenAndLog(supabase, address, { source: "safe" });

    // Autonomous multi-hop forensic trace kicks in on medium-to-high risk.
    await maybeEnqueueTrace(supabase, {
      address: result.address,
      network: result.network,
      source: "safe",
      trigger_reason: `Safe check returned ${result.verdict} (${result.risk_score}/100)`,
      risk_score: result.risk_score,
    });

    const payload = {
      address: result.address,
      network: result.network,
      verdict: result.verdict,
      risk_score: result.risk_score,
      reasons: result.reasons,
      data: result.data,
      evidence_basis,
      view_count: 1,
    };

    const { data: inserted, error } = await supabase
      .from("public_checks")
      .upsert(payload, { onConflict: "address,network", ignoreDuplicates: false })
      .select()
      .maybeSingle();

    if (error) console.warn("cache insert failed", error.message);

    return new Response(JSON.stringify({ ...(inserted ?? payload), cached: false, evidence_basis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("safe-check error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
