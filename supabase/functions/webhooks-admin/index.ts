import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { dispatchWebhooks, deriveSecret } from "../_shared/webhooks.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
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

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = String(body.action ?? "list");
    const workspaceId = body.workspace_id ? String(body.workspace_id) : null;
    if (!workspaceId) return json({ error: "workspace_id required" }, 400);

    // Only owners / compliance officers manage webhooks.
    const { data: member } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member || !["owner", "compliance_officer"].includes(member.role)) {
      return json({ error: "Forbidden: requires owner or compliance officer role" }, 403);
    }

    if (action === "list") {
      const { data } = await admin
        .from("webhook_endpoints")
        .select("id, url, description, secret_prefix, events, is_active, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      return json({ endpoints: data ?? [] });
    }

    if (action === "create") {
      const url = String(body.url ?? "").trim();
      if (!/^https:\/\/.+/i.test(url) || url.length > 500) {
        return json({ error: "url must be a valid https:// endpoint" }, 400);
      }
      const events: string[] = Array.isArray(body.events) && body.events.length
        ? body.events.filter((e: unknown) => typeof e === "string").slice(0, 10)
        : ["risk_change", "case_escalation", "sanctions_hit"];

      const { data: created, error } = await admin
        .from("webhook_endpoints")
        .insert({
          workspace_id: workspaceId,
          url,
          description: body.description ? String(body.description).slice(0, 200) : null,
          events,
          secret_hash: "pending",
          secret_prefix: "pending",
          created_by: userId,
        })
        .select("id, url, events, created_at")
        .single();
      if (error) return json({ error: error.message }, 500);

      const secret = await deriveSecret(created.id);
      await admin
        .from("webhook_endpoints")
        .update({ secret_hash: await sha256Hex(secret), secret_prefix: secret.slice(0, 14) })
        .eq("id", created.id);

      // Secret is shown exactly once here; it is derived on demand for signing.
      return json({ endpoint: { ...created, secret_prefix: secret.slice(0, 14) }, secret });
    }

    if (action === "reveal") {
      const id = String(body.endpoint_id ?? "");
      const { data: ep } = await admin
        .from("webhook_endpoints").select("id").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
      if (!ep) return json({ error: "not found" }, 404);
      return json({ secret: await deriveSecret(ep.id) });
    }

    if (action === "update") {
      const id = String(body.endpoint_id ?? "");
      const patch: Record<string, unknown> = {};
      if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
      if (Array.isArray(body.events)) patch.events = body.events.slice(0, 10);
      if (typeof body.description === "string") patch.description = body.description.slice(0, 200);
      const { error } = await admin.from("webhook_endpoints").update(patch).eq("id", id).eq("workspace_id", workspaceId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete") {
      const id = String(body.endpoint_id ?? "");
      const { error } = await admin.from("webhook_endpoints").delete().eq("id", id).eq("workspace_id", workspaceId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "test") {
      const results = await dispatchWebhooks(
        admin,
        workspaceId,
        { type: "test", data: { message: "Rìan test event", workspace_id: workspaceId, at: new Date().toISOString() } },
        deriveSecret,
        true,
      );
      return json({ results });
    }

    if (action === "deliveries") {
      const { data } = await admin
        .from("webhook_deliveries")
        .select("id, endpoint_id, event_type, status_code, error, attempt, delivered_at, created_at")
        .in(
          "endpoint_id",
          ((await admin.from("webhook_endpoints").select("id").eq("workspace_id", workspaceId)).data ?? []).map((e: any) => e.id),
        )
        .order("created_at", { ascending: false })
        .limit(50);
      return json({ deliveries: data ?? [] });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("webhooks-admin error", e);
    return json({ error: String(e) }, 500);
  }
});
