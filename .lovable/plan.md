# Fix emailed wallet reports

## What's actually happening

The "Email report" dialog never sends an email from the app. When you add recipients and hit send, the app calls the `send-report-webhook` backend function, which forwards a payload to an external Tines automation webhook.

During the earlier security hardening pass, that function was changed to strip the payload down to four fields: record ID, report type, timestamp, and user ID. The recipient list and the report content are no longer forwarded at all. So the external automation receives a ping with no addresses and no report to send — the UI still shows "Report sent successfully" because the webhook returns 200.

That explains why it worked before and silently stopped.

## Recommended fix: send the report from the app itself

Stop depending on an external automation for delivery and send the report through Lovable's built-in email system.

1. Set up a sender domain (a domain you own) — required before any app email can be delivered.
2. Provision the email infrastructure and the send function.
3. Build a branded "Wallet Intelligence Report" email template: verdict/risk score, wallet address and network, key risk reasons, sanctions screening result, analyst notes and case status, plus a link back to the record in Rìan.
4. Rewire the `send-report-webhook` function (renamed to a report-send function) to:
   - verify the caller owns / has workspace access to the record,
   - re-fetch the record server-side rather than trusting the browser payload,
   - cap recipients (the UI already caps at 10) and send one email per recipient with an idempotency key,
   - return a real per-recipient result.
5. Make the UI honest: show which recipients succeeded, and surface real errors instead of a blanket success toast.
6. Keep the Tines webhook call as an optional side-channel notification (no PII), or drop it — your call.

## Interim option if you don't have a sender domain yet

Restore the recipient list and a minimal report summary in the webhook payload so the existing Tines automation can send again, and change the success toast to only fire when the webhook confirms delivery. This is a stopgap: delivery still depends on the external automation, and recipient emails leave the platform.

## Technical notes

- Files touched: `supabase/functions/send-report-webhook/index.ts`, `src/components/EnhancedWalletResults.tsx`, `src/components/EmailReportDialog.tsx` (result states), plus a new email template under `supabase/functions/_shared/transactional-email-templates/`.
- Server-side authorization: reuse the ownership/workspace-membership check pattern already used in `sar-generate`.
- Existing risk-alert emails in `wallet-monitor` use a Resend key directly; once built-in email is in place, that path should be migrated too so there's one sending route. Can be a follow-up.
- Sending requires a sender domain you own; there is no shared/free sender for app emails.
