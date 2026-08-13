# Stopgap: make emailed wallet reports send again

Restore the data the Tines automation needs, and stop the UI claiming success when nothing was delivered.

Tradeoff accepted: delivery still depends on the external automation, and recipient email addresses leave the platform.

## Backend — `send-report-webhook`

Keep the existing auth check (Bearer token, verified user), then:

- Validate the body with Zod instead of ad-hoc string slicing:
  - `emailAddresses`: 1-10 valid email addresses, required
  - `recordId`, `reportType`, `timestamp`, plus a bounded report summary
- Verify the caller actually owns the record (or is a member of its workspace) before forwarding anything — reuse the ownership check pattern from `sar-generate`. Reject with 403 otherwise.
- Re-read the record server-side (`investigation_records`) rather than trusting the browser's copy, and build a minimal summary from it: wallet address, network, risk score, risk level, verdict, top risk factors (capped, truncated), sanctions match count, investigation status, case ID/status, assigned analyst, and a deep link to the record.
- Forward recipients + summary to the Tines webhook.
- Treat the webhook response strictly: only return `success: true` on a 2xx. On non-2xx, return the webhook's status and body text so the failure is visible instead of a generic 500.

## Frontend — `EnhancedWalletResults`

- Send only what the function needs: `recordId`, `reportType`, `timestamp`, `emailAddresses`. The rest is rebuilt server-side.
- Only show the success toast when the response confirms delivery; otherwise show the real error text from the function (read it via `FunctionsHttpError` context rather than the generic "non-2xx" message).
- Keep the dialog open on failure so the recipient list isn't lost.

## Technical notes

- Files: `supabase/functions/send-report-webhook/index.ts`, `src/components/EnhancedWalletResults.tsx`.
- Deploy the edge function after the change.
- The Tines automation must be expecting `emailAddresses` and the summary fields; if its payload contract differs, the field names may need adjusting once you see what it receives.
- The proper fix (sending from the app via a verified sender domain, no third-party hop) remains available whenever you want it.
