import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const ctx = body.context ?? {};

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a compact investigation context
    const ctxLines: string[] = [];
    if (ctx.address) ctxLines.push(`Wallet: ${ctx.address}`);
    if (ctx.network) ctxLines.push(`Network: ${ctx.network}`);
    if (typeof ctx.risk_score === "number")
      ctxLines.push(`Risk score: ${ctx.risk_score}/100`);
    if (ctx.risk_level) ctxLines.push(`Risk level: ${ctx.risk_level}`);
    if (Array.isArray(ctx.risk_factors) && ctx.risk_factors.length) {
      ctxLines.push(
        `Risk factors: ${ctx.risk_factors
          .slice(0, 8)
          .map((f: any) => `${f.factor_type ?? f.type ?? "factor"} (${f.severity ?? "?"})`)
          .join(", ")}`,
      );
    }
    if (Array.isArray(ctx.sanctions) && ctx.sanctions.length) {
      ctxLines.push(
        `Sanctions hits: ${ctx.sanctions
          .slice(0, 5)
          .map((s: any) => `${s.entity_name ?? "Unknown"} [${s.source_list ?? "?"}]`)
          .join(", ")}`,
      );
    }
    if (Array.isArray(ctx.counterparties) && ctx.counterparties.length) {
      ctxLines.push(
        `Top counterparties: ${ctx.counterparties
          .slice(0, 5)
          .map((c: any) => `${c.entity_name ?? c.address?.slice(0, 8) ?? "?"} (${c.risk_level ?? "?"})`)
          .join(", ")}`,
      );
    }

    const systemPrompt = `You are Holly, a senior blockchain compliance investigator AI assistant on the Rìan platform.
You help analysts interpret wallet risk, sanctions exposure, counterparty intelligence, and draft investigation narratives.
Be concise, factual, and use markdown (bold, lists) for clarity. When uncertain, say so.
Never invent transactions, addresses, or sanctions list entries.

Current investigation context:
${ctxLines.length ? ctxLines.join("\n") : "(no investigation loaded)"}`;

    const upstream = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      },
    );

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (upstream.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Workspace Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const txt = await upstream.text();
      console.error("AI gateway error", upstream.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-holly error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
