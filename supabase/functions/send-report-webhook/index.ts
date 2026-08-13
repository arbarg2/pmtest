import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const WEBHOOK_URL = "https://pat.tines.com/webhook/aml-buddy-bot-2/010e55b671e752ae9888806bfb8d0e2d";

const BodySchema = z.object({
  recordId: z.string().trim().min(1).max(200),
  reportType: z.string().trim().min(1).max(80).optional(),
  timestamp: z.string().trim().max(64).optional(),
  emailAddresses: z.array(z.string().trim().toLowerCase().email().max(255)).min(1).max(10),
});

const truncate = (v: unknown, n = 300) =>
  v === null || v === undefined ? null : String(v).slice(0, n);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ success: false, error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) return json({ success: false, error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json({ success: false, error: "Invalid request", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { recordId, reportType, timestamp, emailAddresses } = parsed.data;
    const recipients = Array.from(new Set(emailAddresses));

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ---- fetch the record server-side (id or human-readable record_id) ----
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recordId);
    const { data: record } = await admin
      .from("investigation_records")
      .select(
        "id, record_id, user_id, workspace_id, wallet_address, network, risk_score, risk_level, analysis_data, analyst_notes, investigation_status, is_case, case_id, case_status, case_created_at, assigned_to, created_at",
      )
      .eq(isUuid ? "id" : "record_id", recordId)
      .maybeSingle();

    if (!record) return json({ success: false, error: "Record not found" }, 404);

    // ---- authorization: owner or workspace member ----
    let allowed = record.user_id === userId;
    if (!allowed && record.workspace_id) {
      const { data: isMember } = await admin.rpc("is_workspace_member", {
        _workspace_id: record.workspace_id,
        _user_id: userId,
      });
      allowed = Boolean(isMember);
    }
    if (!allowed) return json({ success: false, error: "Forbidden" }, 403);

    // ---- supporting evidence, capped ----
    const [{ data: factors }, { data: screening }] = await Promise.all([
      admin
        .from("risk_factors")
        .select("factor_type, severity, score, description")
        .eq("lookup_record_id", record.id)
        .order("score", { ascending: false })
        .limit(5),
      admin
        .from("sanctions_screening")
        .select("entity_name, match_type, source_list, confidence_score")
        .eq("lookup_record_id", record.id)
        .limit(10),
    ]);

    const health = (record.analysis_data as any)?.health_check ?? null;
    const appOrigin = Deno.env.get("APP_ORIGIN") ?? "https://tryrian.lovable.app";

    const payload = {
      recordId: record.record_id ?? record.id,
      reportType: reportType ?? "wallet_intelligence",
      timestamp: timestamp ?? new Date().toISOString(),
      userId,
      emailAddresses: recipients,
      report: {
        walletAddress: record.wallet_address,
        network: record.network,
        riskScore: record.risk_score,
        riskLevel: record.risk_level,
        verdict: truncate(health?.verdict, 40),
        investigationStatus: record.investigation_status,
        isCase: record.is_case,
        caseId: record.case_id,
        caseStatus: record.case_status,
        caseCreatedAt: record.case_created_at,
        assignedTo: record.assigned_to,
        analystNotes: truncate(record.analyst_notes, 1000),
        sanctionsMatchCount: (screening ?? []).length,
        sanctionsMatches: (screening ?? []).slice(0, 5).map((s) => ({
          entityName: truncate(s.entity_name, 120),
          matchType: truncate(s.match_type, 40),
          sourceList: truncate(s.source_list, 80),
          confidence: s.confidence_score,
        })),
        topRiskFactors: (factors ?? []).map((f) => ({
          type: truncate(f.factor_type, 80),
          severity: truncate(f.severity, 20),
          score: f.score,
          description: truncate(f.description, 240),
        })),
        recordUrl: `${appOrigin}/record/${record.id}`,
        createdAt: record.created_at,
      },
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error(`Report webhook failed [${response.status}]: ${details}`);
      return json(
        {
          success: false,
          error: `Delivery service rejected the report (HTTP ${response.status})`,
          details: details.slice(0, 500),
        },
        502,
      );
    }

    console.log(`Report for ${payload.recordId} forwarded for ${recipients.length} recipient(s)`);
    return json({ success: true, recipients: recipients.length, message: "Report queued for delivery" });
  } catch (error) {
    console.error("Error sending report:", error);
    return json({ success: false, error: "Failed to send report", details: (error as Error).message }, 500);
  }
});
