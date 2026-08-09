import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

interface EvidenceItem {
  id: string;
  kind: "decision" | "rule" | "sanction" | "counterparty" | "record";
  statement: string;
  source: string;
  observed_at: string | null;
  data: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => ({}));
    const address = String(body.address ?? "").trim();
    const recordId = body.record_id ? String(body.record_id) : null;
    if (!address) return json({ error: "address required" }, 400);

    // ---------------- assemble the evidence bundle (facts only) --------------
    const evidence: EvidenceItem[] = [];
    let n = 0;
    const nextId = () => `E${++n}`;

    const { data: decisions } = await admin
      .from("screening_decisions")
      .select("id, address, network, verdict, risk_score, ruleset_version, block_height, entity_category, rules_evaluated, provenance, created_at")
      .ilike("address", address)
      .order("created_at", { ascending: false })
      .limit(3);

    const latest = (decisions ?? [])[0] ?? null;
    const network = latest?.network ?? String(body.network ?? "unknown");

    for (const d of decisions ?? []) {
      evidence.push({
        id: nextId(),
        kind: "decision",
        statement: `Screening decision ${d.id}: verdict "${d.verdict}" with risk score ${d.risk_score}/100 under ruleset ${d.ruleset_version}${
          d.block_height ? ` at block height ${d.block_height}` : ""
        }.`,
        source: `screening_decisions.${d.id}`,
        observed_at: d.created_at,
        data: { verdict: d.verdict, risk_score: d.risk_score, ruleset_version: d.ruleset_version, block_height: d.block_height },
      });
      for (const r of (d.rules_evaluated as any[]) ?? []) {
        if (!r?.rule_id || (r.applied_score ?? 0) === 0) continue;
        evidence.push({
          id: nextId(),
          kind: "rule",
          statement: `Rule "${r.rule_id}" fired (severity ${r.severity}, contribution ${r.applied_score}): ${r.description}`,
          source: `screening_decisions.${d.id}.rules_evaluated.${r.rule_id}`,
          observed_at: d.created_at,
          data: r,
        });
      }
      break; // rules from the latest decision only
    }

    const { data: sanctions } = await admin
      .from("sanctions_addresses")
      .select("id, address, network, entity_name, source_list, program, date_listed, updated_at")
      .ilike("address", address)
      .limit(5);
    for (const s of sanctions ?? []) {
      evidence.push({
        id: nextId(),
        kind: "sanction",
        statement: `Address matched ${s.source_list ?? "OFAC SDN"} entry "${s.entity_name ?? "unnamed entity"}" (list entry ${s.id}${
          s.program ? `, program ${s.program}` : ""
        }${s.date_listed ? `, listed ${s.date_listed}` : ""}); list snapshot dated ${s.updated_at}.`,
        source: `sanctions_addresses.${s.id}`,
        observed_at: s.updated_at,
        data: s,
      });
    }

    let record: any = null;
    if (recordId) {
      const { data } = await admin
        .from("investigation_records")
        .select("id, record_id, wallet_address, network, risk_score, risk_level, analyst_notes, investigation_status, analysis_data, created_at, user_id, workspace_id")
        .eq("id", recordId)
        .maybeSingle();
      record = data;
      if (!record) return json({ error: "Record not found" }, 404);

      // Authorization: caller must own the record or belong to its workspace
      let allowed = record.user_id === userId;
      if (!allowed && record.workspace_id) {
        const { data: isMember } = await admin.rpc("is_workspace_member", {
          _workspace_id: record.workspace_id,
          _user_id: userId,
        });
        allowed = isMember === true;
      }
      if (!allowed) return json({ error: "Forbidden" }, 403);

      {

        evidence.push({
          id: nextId(),
          kind: "record",
          statement: `Investigation record ${record.record_id} opened ${record.created_at} with risk level ${record.risk_level} (${record.risk_score}/100), status "${record.investigation_status}".`,
          source: `investigation_records.${record.id}`,
          observed_at: record.created_at,
          data: { record_id: record.record_id, risk_level: record.risk_level, risk_score: record.risk_score },
        });
        const cps = (record.analysis_data?.counterparties ?? record.analysis_data?.counterparty_intelligence ?? []) as any[];
        for (const c of (Array.isArray(cps) ? cps : []).slice(0, 8)) {
          evidence.push({
            id: nextId(),
            kind: "counterparty",
            statement: `Counterparty ${c.address ?? c.entity_name ?? "unknown"}${
              c.entity_name ? ` (${c.entity_name})` : ""
            }${c.risk_level ? `, risk ${c.risk_level}` : ""}${c.volume ? `, volume ${c.volume}` : ""}.`,
            source: `investigation_records.${record.id}.analysis_data.counterparties`,
            observed_at: record.created_at,
            data: c,
          });
        }
      }
    }

    if (evidence.length === 0) {
      return json({
        error: "No immutable evidence exists for this address yet. Run a screening first so a decision record is created.",
      }, 409);
    }

    // ---------------- constrained generation --------------------------------
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const bundleText = evidence.map((e) => `[${e.id}] (${e.kind}, source ${e.source}, observed ${e.observed_at}) ${e.statement}`).join("\n");

    const systemPrompt = `You are a compliance report writer producing a SAR (Suspicious Activity Report) narrative draft.

ABSOLUTE RULES:
- You may ONLY state facts that appear in the EVIDENCE BUNDLE below.
- Every factual sentence MUST end with one or more citation markers referencing evidence IDs, e.g. [E3] or [E3][E7].
- NEVER invent addresses, amounts, dates, transaction hashes, entity names, list IDs or counterparties.
- If a required section has no supporting evidence, write exactly: "No supporting evidence on file." (no citation).
- Do not speculate about intent beyond what the evidence supports.

Produce these markdown sections, in order:

**SUSPICIOUS ACTIVITY REPORT — NARRATIVE (DRAFT)**

### 1. Subject
### 2. Summary of Suspicious Activity
### 3. Risk Assessment
### 4. Sanctions & Watchlist Exposure
### 5. Counterparty & Transaction Patterns
### 6. Regulatory Relevance
### 7. Recommended Action
### 8. Analyst Notes
- "_To be completed by reviewing analyst._"

End with: "*Draft generated by Holly from immutable evidence records — analyst review and verification required prior to filing.*"

SUBJECT ADDRESS: ${address} (${network})

EVIDENCE BUNDLE:
${bundleText}`;

    const callModel = async (extra = "") => {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt + extra },
            { role: "user", content: "Draft the SAR narrative now, citing evidence IDs on every factual sentence." },
          ],
        }),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
        if (res.status === 402) throw new Error("AI credits exhausted.");
        throw new Error(`AI gateway error ${res.status}`);
      }
      const data = await res.json();
      return String(data?.choices?.[0]?.message?.content ?? "");
    };

    // ---------------- validation: reject unsupported facts -------------------
    const validIds = new Set(evidence.map((e) => e.id));
    const knownAddresses = new Set<string>([address.toLowerCase()]);
    for (const e of evidence) {
      const s = JSON.stringify(e.data).toLowerCase();
      for (const m of s.matchAll(/0x[a-f0-9]{40}|\b(?:1|3|bc1)[a-z0-9]{25,59}\b/g)) knownAddresses.add(m[0]);
    }

    const validate = (text: string) => {
      const issues: string[] = [];
      const cited = [...text.matchAll(/\[(E\d+)\]/g)].map((m) => m[1]);
      const unknownCitations = [...new Set(cited)].filter((c) => !validIds.has(c));
      if (unknownCitations.length) issues.push(`Unknown citation ids: ${unknownCitations.join(", ")}`);
      if (cited.length === 0) issues.push("No citations present.");
      const addrs = [...text.toLowerCase().matchAll(/0x[a-f0-9]{40}|\b(?:1|3|bc1)[a-z0-9]{25,59}\b/g)].map((m) => m[0]);
      const hallucinated = [...new Set(addrs)].filter((a) => !knownAddresses.has(a));
      if (hallucinated.length) issues.push(`Addresses not present in evidence: ${hallucinated.slice(0, 5).join(", ")}`);
      return { ok: issues.length === 0, issues, citations: [...new Set(cited)] };
    };

    let narrative = await callModel();
    let check = validate(narrative);
    if (!check.ok) {
      narrative = await callModel(
        `\n\nYOUR PREVIOUS DRAFT WAS REJECTED for: ${check.issues.join("; ")}. Regenerate strictly within the evidence bundle.`,
      );
      check = validate(narrative);
    }

    const appendix =
      "\n\n---\n\n### Evidence Appendix\n" +
      evidence.map((e) => `- **[${e.id}]** ${e.statement}  \n  _Source: \`${e.source}\` · observed ${e.observed_at ?? "n/a"}_`).join("\n");

    const full = narrative + appendix;

    // ---------------- persist with a frozen evidence snapshot ----------------
    const { data: saved, error: saveErr } = await admin
      .from("sar_drafts")
      .insert({
        workspace_id: record?.workspace_id ?? body.workspace_id ?? null,
        record_id: recordId,
        created_by: userId,
        address,
        network,
        narrative: full,
        evidence_bundle: { items: evidence, subject: { address, network }, generated_at: new Date().toISOString() },
        validation: check,
      })
      .select("id, created_at")
      .maybeSingle();
    if (saveErr) console.warn("sar save failed", saveErr.message);

    return json({
      id: saved?.id ?? null,
      narrative: full,
      evidence,
      validation: check,
      created_at: saved?.created_at ?? new Date().toISOString(),
    });
  } catch (e) {
    console.error("sar-generate error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
