// Signed outbound webhook delivery.
//
// Signature scheme (Stripe-style, verifiable by any consumer):
//   X-Rian-Timestamp: <unix seconds>
//   X-Rian-Signature: t=<unix seconds>,v1=<hex hmac-sha256 of `${t}.${rawBody}`>
// Consumers must reject timestamps older than 5 minutes to guard against replay.

export const SIGNATURE_HEADER = "X-Rian-Signature";
export const TIMESTAMP_HEADER = "X-Rian-Timestamp";

export async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signPayload(secret: string, rawBody: string, timestamp = Math.floor(Date.now() / 1000)) {
  const v1 = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return { timestamp, header: `t=${timestamp},v1=${v1}`, v1 };
}

/** Endpoint secrets are derived, never stored: whsec_<hmac(master, endpoint_id)>. */
export async function deriveSecret(endpointId: string) {
  const master = Deno.env.get("WEBHOOK_SIGNING_MASTER_KEY") ?? "";
  return "whsec_" + (await hmacSha256Hex(master, `webhook:${endpointId}`));
}

export interface WebhookEvent {
  type: "risk_change" | "case_escalation" | "sanctions_hit" | "test";
  data: Record<string, unknown>;
}

/**
 * Deliver an event to every active endpoint in a workspace that subscribes to it.
 * Each attempt is written to `webhook_deliveries`. One retry on network/5xx failure.
 * `secretResolver` must return the plaintext secret for an endpoint id.
 */
export async function dispatchWebhooks(
  supabase: any,
  workspaceId: string,
  event: WebhookEvent,
  secretResolver: (endpointId: string) => Promise<string | null> = deriveSecret,
  ignoreSubscription = false,
) {
  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select("id, url, events, is_active")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);

  const targets = (endpoints ?? []).filter((e: any) => ignoreSubscription || (e.events ?? []).includes(event.type));
  const results: any[] = [];

  for (const endpoint of targets) {
    const secret = await secretResolver(endpoint.id);
    if (!secret) {
      await supabase.from("webhook_deliveries").insert({
        endpoint_id: endpoint.id, event_type: event.type, payload: event.data,
        error: "signing secret unavailable", attempt: 1,
      });
      continue;
    }

    const body = JSON.stringify({
      id: crypto.randomUUID(),
      type: event.type,
      created: Math.floor(Date.now() / 1000),
      data: event.data,
    });
    const { header, timestamp } = await signPayload(secret, body);

    let lastStatus: number | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [SIGNATURE_HEADER]: header,
            [TIMESTAMP_HEADER]: String(timestamp),
            "User-Agent": "Rian-Webhooks/1",
          },
          body,
        });
        lastStatus = res.status;
        lastError = res.ok ? null : `HTTP ${res.status}`;
        await supabase.from("webhook_deliveries").insert({
          endpoint_id: endpoint.id, event_type: event.type, payload: JSON.parse(body),
          signature: header, status_code: res.status, error: lastError, attempt,
          delivered_at: res.ok ? new Date().toISOString() : null,
        });
        if (res.ok) break;
        if (res.status < 500) break; // don't retry client errors
      } catch (e) {
        lastError = String(e);
        await supabase.from("webhook_deliveries").insert({
          endpoint_id: endpoint.id, event_type: event.type, payload: JSON.parse(body),
          signature: header, error: lastError, attempt,
        });
      }
    }

    results.push({ endpoint_id: endpoint.id, status: lastStatus, error: lastError });
  }

  return results;
}
