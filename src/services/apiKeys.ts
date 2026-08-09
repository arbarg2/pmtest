import { supabase } from "@/integrations/supabase/client";

export interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  plan: string;
  monthly_quota: number;
  rate_limit_per_min: number;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
  usage_this_month?: number;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomSecret(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Creates a new API key. The plaintext key is returned exactly once and is
 * never stored anywhere — only its SHA-256 hash is persisted.
 */
export async function createApiKey(name: string): Promise<{ key: string; row: ApiKeyRow }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("You must be signed in to create an API key.");

  const plaintext = `rian_live_${randomSecret(32)}`;
  const key_hash = await sha256Hex(plaintext);
  const key_prefix = plaintext.slice(0, 18);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name: name.trim() || "Default key",
      key_hash,
      key_prefix,
    })
    .select("id, name, key_prefix, plan, monthly_quota, rate_limit_per_min, revoked_at, last_used_at, created_at")
    .single();

  if (error) throw new Error(error.message);
  return { key: plaintext, row: data as ApiKeyRow };
}

export async function listApiKeys(): Promise<ApiKeyRow[]> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, plan, monthly_quota, rate_limit_per_min, revoked_at, last_used_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ApiKeyRow[];

  // Usage counts for the current calendar month
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  await Promise.all(
    rows.map(async (row) => {
      const { count } = await supabase
        .from("api_requests")
        .select("id", { count: "exact", head: true })
        .eq("api_key_id", row.id)
        .gte("created_at", startOfMonth.toISOString());
      row.usage_this_month = count ?? 0;
    }),
  );

  return rows;
}

export async function revokeApiKey(id: string) {
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteApiKey(id: string) {
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export const API_BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/api`;
