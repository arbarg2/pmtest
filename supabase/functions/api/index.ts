import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { screenAddress, lookupSanctions, detectNetwork } from "../_shared/screening.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

const errorBody = (code: string, message: string, docs = "https://tryrian.lovable.app/api-docs") => ({
  error: { code, message, docs },
});

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const started = Date.now();
  const url = new URL(req.url);
  // Path arrives as /api/v1/... (or /v1/... depending on gateway) — normalise it.
  const path = "/" + url.pathname.replace(/^\/+/, "").replace(/^functions\/v1\//, "").replace(/^api\/?/, "").replace(/^\/+/, "");
  const route = path === "/" ? "/" : path.replace(/\/+$/, "");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // ---- Authentication ---------------------------------------------------
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token || !token.startsWith("rian_")) {
    return json(
      errorBody("missing_api_key", "Provide your API key as `Authorization: Bearer rian_live_...`."),
      401,
    );
  }

  const keyHash = await sha256Hex(token);
  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("id, user_id, name, plan, monthly_quota, rate_limit_per_min, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!apiKey) {
    return json(errorBody("invalid_api_key", "This API key is not recognised."), 401);
  }
  if (apiKey.revoked_at) {
    return json(errorBody("revoked_api_key", "This API key has been revoked."), 403);
  }

  const logRequest = async (status: number) => {
    try {
      await supabase.from("api_requests").insert({
        api_key_id: apiKey.id,
        endpoint: route,
        status_code: status,
        duration_ms: Date.now() - started,
      });
      await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);
    } catch (e) {
      console.warn("log failed", e);
    }
  };

  const finish = async (body: unknown, status = 200, extra: Record<string, string> = {}) => {
    await logRequest(status);
    return json(body, status, extra);
  };

  // ---- Rate limit (sliding 60s window) ----------------------------------
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount } = await supabase
    .from("api_requests")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", apiKey.id)
    .gte("created_at", since);

  if ((recentCount ?? 0) >= apiKey.rate_limit_per_min) {
    return await finish(
      errorBody("rate_limit_exceeded", `Rate limit of ${apiKey.rate_limit_per_min} requests/minute exceeded.`),
      429,
      { "Retry-After": "60" },
    );
  }

  // ---- Monthly quota -----------------------------------------------------
  const { data: usedThisMonth } = await supabase.rpc("api_usage_this_month", { _key_id: apiKey.id });
  const used = Number(usedThisMonth ?? 0);
  if (used >= apiKey.monthly_quota) {
    return await finish(
      errorBody("quota_exceeded", `Monthly quota of ${apiKey.monthly_quota} requests reached for this key.`),
      429,
    );
  }

  const quotaHeaders = {
    "X-RateLimit-Limit": String(apiKey.rate_limit_per_min),
    "X-RateLimit-Remaining": String(Math.max(0, apiKey.rate_limit_per_min - (recentCount ?? 0) - 1)),
    "X-Quota-Limit": String(apiKey.monthly_quota),
    "X-Quota-Remaining": String(Math.max(0, apiKey.monthly_quota - used - 1)),
  };

  try {
    // ---- Routes ----------------------------------------------------------
    if (route === "/v1/me" && req.method === "GET") {
      return await finish(
        {
          key: { id: apiKey.id, name: apiKey.name, plan: apiKey.plan },
          limits: {
            rate_limit_per_min: apiKey.rate_limit_per_min,
            monthly_quota: apiKey.monthly_quota,
            used_this_month: used,
            remaining_this_month: Math.max(0, apiKey.monthly_quota - used),
          },
        },
        200,
        quotaHeaders,
      );
    }

    if (route === "/v1/screen" && req.method === "GET") {
      const address = (url.searchParams.get("address") ?? "").trim();
      if (!address) {
        return await finish(errorBody("invalid_request", "Query parameter `address` is required."), 400, quotaHeaders);
      }
      if (address.length > 128) {
        return await finish(errorBody("invalid_request", "Address is too long."), 400, quotaHeaders);
      }
      if (!detectNetwork(address)) {
        return await finish(
          errorBody("unsupported_address", "Address format not recognised. Supported: Bitcoin, Ethereum, Solana."),
          400,
          quotaHeaders,
        );
      }
      const result = await screenAddress(supabase, address);
      return await finish(result, 200, quotaHeaders);
    }

    if (route === "/v1/screen/batch" && req.method === "POST") {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return await finish(errorBody("invalid_request", "Request body must be valid JSON."), 400, quotaHeaders);
      }
      const addresses = body?.addresses;
      if (!Array.isArray(addresses) || addresses.length === 0) {
        return await finish(errorBody("invalid_request", "`addresses` must be a non-empty array."), 400, quotaHeaders);
      }
      if (addresses.length > 25) {
        return await finish(errorBody("invalid_request", "Maximum 25 addresses per batch request."), 400, quotaHeaders);
      }
      if (!addresses.every((a: unknown) => typeof a === "string" && a.length > 0 && a.length <= 128)) {
        return await finish(errorBody("invalid_request", "Each address must be a string of 1-128 characters."), 400, quotaHeaders);
      }

      const results = await Promise.all(
        addresses.map(async (a: string) => {
          try {
            if (!detectNetwork(a.trim())) {
              return { address: a, error: { code: "unsupported_address", message: "Address format not recognised." } };
            }
            return await screenAddress(supabase, a);
          } catch (e) {
            return { address: a, error: { code: "screen_failed", message: e instanceof Error ? e.message : "unknown" } };
          }
        }),
      );
      return await finish({ count: results.length, results }, 200, quotaHeaders);
    }

    if (route === "/v1/sanctions/check" && req.method === "GET") {
      const address = (url.searchParams.get("address") ?? "").trim();
      if (!address || address.length > 128) {
        return await finish(errorBody("invalid_request", "Query parameter `address` is required."), 400, quotaHeaders);
      }
      const hit = await lookupSanctions(supabase, address);
      return await finish(
        {
          address,
          matched: !!hit,
          match: hit
            ? {
                entity_name: hit.entity_name,
                source_list: hit.source_list,
                program: hit.program,
                date_listed: hit.date_listed ?? null,
                network: hit.network ?? null,
              }
            : null,
        },
        200,
        quotaHeaders,
      );
    }

    return await finish(
      errorBody("not_found", `No route matches ${req.method} ${route}. See the docs for available endpoints.`),
      404,
      quotaHeaders,
    );
  } catch (e) {
    console.error("api error", e);
    return await finish(errorBody("internal_error", "Something went wrong processing this request."), 500, quotaHeaders);
  }
});
