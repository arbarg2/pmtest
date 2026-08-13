// Shared authentication for scheduled (pg_cron) edge functions.
//
// Two accepted credentials:
//   1. The CRON_SECRET environment variable (manual / operator-triggered runs).
//   2. The `sync_cron_secret` stored in Vault, which pg_cron reads at call time.
//      Keeping the scheduler's copy in Vault means the database can send it in a
//      header without the value being hardcoded into the job definition.
export async function isAuthorizedCronCall(
  req: Request,
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> },
): Promise<boolean> {
  const provided =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!provided) return false;

  const envSecret = Deno.env.get("CRON_SECRET");
  if (envSecret && provided === envSecret) return true;

  try {
    const { data } = await supabase.rpc("verify_cron_secret", { _provided: provided });
    return data === true;
  } catch (e) {
    console.error("cron secret verification failed:", e);
    return false;
  }
}
