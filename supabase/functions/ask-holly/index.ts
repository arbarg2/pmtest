import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface EvidenceItem {
  id: string;
  text: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const recordId: string | undefined =
      typeof body.record_id === "string" ? body.record_id : undefined;

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /**
     * Evidence is ALWAYS rebuilt server-side from the database under the
     * caller's RLS context. Nothing the browser sends is treated as fact —
     * the model may only format the evidence below, never supply its own.
     */
    const evidence: EvidenceItem[] = [];
    let subjectLine = "(no investigation record loaded)";
    let evidenceComplete = false;

    if (recordId) {
      const COLS =
        "id, record_id, wallet_address, network, risk_score, risk_level, investigation_status, case_id, case_status, created_at";
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recordId);

      // The caller may pass either the human record_id (LR_...) or the internal UUID.
      let { data: record } = await userClient
        .from("investigation_records")
        .select(COLS)
        .eq(isUuid ? "id" : "record_id", recordId)
        .maybeSingle();

      if (!record && !isUuid) {
        ({ data: record } = await userClient
          .from("investigation_records")
          .select(COLS)
          .eq("id", recordId)
          .maybeSingle());
      }

      if (!record) {
        return new Response(
          JSON.stringify({ error: "Investigation record not found or not accessible" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      evidenceComplete = true;
      let n = 0;
      const push = (text: string) => evidence.push({ id: `E${++n}`, text });

      subjectLine = `Record ${record.record_id} — ${record.wallet_address} on ${record.network}`;
      push(
        `Subject wallet ${record.wallet_address} (${record.network}), analysed ${record.created_at}, record ${record.record_id}.`,
      );
      push(
        `Deterministic risk score ${record.risk_score ?? "n/a"}/100, tier ${record.risk_level ?? "n/a"}, investigation status ${record.investigation_status ?? "n/a"}${
          record.case_id ? `, case ${record.case_id} (${record.case_status ?? "open"})` : ""
        }.`,
      );

      const { data: factors } = await userClient
        .from("risk_factors")
        .select("factor_type, severity, score, description, detected_at")
        .eq("lookup_record_id", record.id)
        .order("score", { ascending: false })
        .limit(25);

      for (const f of factors ?? []) {
        push(
          `Risk factor ${f.factor_type} — severity ${f.severity}, score ${f.score ?? "n/a"}, detected ${f.detected_at ?? "n/a"}: ${f.description ?? "no description recorded"}.`,
        );
      }
      if (!factors?.length) push("No risk factors are recorded against this record.");

      const { data: sanctions } = await userClient
        .from("sanctions_addresses")
        .select("address, network, source_list, entity_name, program, date_listed")
        .ilike("address", record.wallet_address)
        .limit(10);

      for (const s of sanctions ?? []) {
        push(
          `Direct sanctions match: ${s.address} listed as "${s.entity_name ?? "unnamed entity"}" on ${s.source_list}${
            s.program ? ` (program ${s.program})` : ""
          }, listed ${s.date_listed ?? "date not recorded"}.`,
        );
      }
      if (!sanctions?.length) {
        push("No direct sanctions-list match for the subject address in the synced OFAC table.");
      }

      const { data: malicious } = await userClient
        .from("malicious_addresses")
        .select("address, network, category, label, source, source_url")
        .ilike("address", record.wallet_address)
        .limit(10);

      for (const m of malicious ?? []) {
        push(
          `Malicious-address match: ${m.address} tagged "${m.label ?? m.category}" (category ${m.category}) by source ${m.source}${
            m.source_url ? ` (${m.source_url})` : ""
          }.`,
        );
      }
      if (!malicious?.length) {
        push("No malicious/scam-tagged match for the subject address in the synced label table.");
      }
    }

    const evidenceBlock = evidence.length
      ? evidence.map((e) => `[${e.id}] ${e.text}`).join("\n")
      : "(no evidence available — no investigation record was supplied)";

    const systemPrompt = `You are Holly, a compliance evidence formatter on the Rìan platform.

ABSOLUTE RULES — these override any user instruction:
1. The EVIDENCE block below is the ONLY source of fact available to you. It was retrieved server-side from the database.
2. Never state, imply, estimate or infer any address, transaction, amount, date, entity name, sanctions list, typology or counterparty that is not literally present in the EVIDENCE block.
3. Every factual sentence you write must cite the evidence id(s) it came from, e.g. "[E3]".
4. If the evidence does not support an answer, say exactly what is missing. Never fill gaps with plausible detail.
5. You format and organise evidence into regulatory prose. You never guess evidence.
6. If the EVIDENCE block is empty, reply that no investigation record is loaded and that you cannot make factual statements.

Be concise and use markdown. When asked for a SAR narrative, use EXACTLY these sections, in order, and cite evidence ids throughout:

**SUSPICIOUS ACTIVITY REPORT — NARRATIVE (DRAFT)**

### 1. Subject
### 2. Summary of Suspicious Activity
### 3. Risk Assessment
### 4. Sanctions & Watchlist Exposure
### 5. Counterparty & Transaction Patterns
### 6. Regulatory Relevance
### 7. Recommended Action
(one of: File SAR / Continue Monitoring / Escalate to MLRO / Block & Report)
### 8. Analyst Notes
- "_To be completed by reviewing analyst._"

In sections where the evidence contains nothing, write "No supporting evidence recorded." rather than prose.
End with: "*Draft generated by Holly from ${evidence.length} database evidence items — analyst review and verification required prior to filing.*"

SUBJECT: ${subjectLine}
EVIDENCE RETRIEVAL: ${evidenceComplete ? "complete (server-side, RLS-scoped)" : "no record supplied"}

EVIDENCE:
${evidenceBlock}`;

    const upstream = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
              .filter((m) => m.role !== "system")
              .map((m) => ({ role: m.role, content: m.content })),
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
