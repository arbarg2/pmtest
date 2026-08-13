
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { screenAndLog } from '../_shared/screening.ts'
import { dispatchWebhooks } from '../_shared/webhooks.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WatchedWallet {
  id: string;
  wallet_address: string;
  network: string;
  initial_risk_score: number;
  current_risk_score: number;
  alert_threshold: number;
  user_id: string;
}

const APP_URL = Deno.env.get('APP_URL') ?? 'https://tryrian.lovable.app';

/**
 * Emails the watcher when a monitored wallet's risk moves, if they have
 * email alerts enabled. Silently skipped when no mail provider is configured.
 */
async function sendAlertEmail(
  supabase: any,
  userId: string | null,
  address: string,
  oldScore: number,
  newScore: number,
) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey || !userId) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('alert_email_enabled')
    .eq('id', userId)
    .maybeSingle();
  if (profile && profile.alert_email_enabled === false) return;

  const { data: userRes } = await supabase.auth.admin.getUserById(userId);
  const email = userRes?.user?.email;
  if (!email) return;

  const rising = newScore > oldScore;
  const short = `${address.slice(0, 8)}…${address.slice(-6)}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('ALERT_FROM_EMAIL') ?? 'Rìan Alerts <alerts@tryrian.app>',
        to: [email],
        subject: `${rising ? '⚠️' : '✅'} Risk ${rising ? 'increased' : 'decreased'} for ${short}`,
        html: `
          <p>A wallet you're monitoring has changed risk score.</p>
          <p><strong>${address}</strong></p>
          <p>Risk score: ${oldScore.toFixed(1)} → <strong>${newScore.toFixed(1)}</strong></p>
          <p><a href="${APP_URL}/safe/check/${address}">Open the latest check</a></p>
          <p style="color:#888;font-size:12px">You can turn these emails off in your Rìan alert settings.</p>
        `,
      }),
    });
    if (!res.ok) console.error('Alert email failed', await res.text());
  } catch (e) {
    console.error('Alert email error', e);
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const expected = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || !provided || provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting wallet monitoring check...');

    // Get all active watched wallets that need checking (last checked > 24h ago)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: watchedWallets, error: fetchError } = await supabaseClient
      .from('watched_wallets')
      .select('*')
      .eq('status', 'active')
      .lt('last_checked', twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching watched wallets:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${watchedWallets?.length || 0} wallets to monitor`);

    if (!watchedWallets || watchedWallets.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No wallets need monitoring at this time' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const alerts = [];

    // Check each wallet for changes
    for (const wallet of watchedWallets as WatchedWallet[]) {
      try {
        console.log(`Monitoring wallet: ${wallet.wallet_address}`);

        // Real re-screen using the shared screening engine
        const screened = await screenAndLog(supabaseClient, wallet.wallet_address, {
          source: 'monitor', userId: (wallet as any).user_id ?? null, workspaceId: (wallet as any).workspace_id ?? null,
        });
        const newRiskScore = screened.risk_score;
        const riskChange = Math.abs(newRiskScore - Number(wallet.current_risk_score ?? 0));

        // Check if risk change exceeds threshold
        if (riskChange >= wallet.alert_threshold) {
          console.log(`Risk change detected for ${wallet.wallet_address}: ${riskChange}`);

          // Create alert
          const { error: alertError } = await supabaseClient
            .from('watch_alerts')
            .insert({
              watched_wallet_id: wallet.id,
              alert_type: 'risk_score_change',
              old_value: wallet.current_risk_score.toString(),
              new_value: newRiskScore.toString(),
              risk_change: riskChange,
              alert_message: `Risk score changed from ${wallet.current_risk_score.toFixed(1)} to ${newRiskScore.toFixed(1)} (change: ${riskChange.toFixed(1)})`
            });

          if (alertError) {
            console.error('Error creating alert:', alertError);
          } else {
            alerts.push({
              wallet_address: wallet.wallet_address,
              old_risk: wallet.current_risk_score,
              new_risk: newRiskScore,
              change: riskChange
            });

            const workspaceId = (wallet as any).workspace_id ?? null;
            if (workspaceId) {
              await dispatchWebhooks(supabaseClient, workspaceId, {
                type: screened.data?.sanctioned ? 'sanctions_hit' : 'risk_change',
                data: {
                  address: wallet.wallet_address,
                  network: screened.network,
                  previous_risk_score: Number(wallet.current_risk_score ?? 0),
                  risk_score: newRiskScore,
                  verdict: screened.verdict,
                  decision_id: screened.decision_id,
                  ruleset_version: screened.provenance?.ruleset_version,
                  block_height: screened.provenance?.block_height ?? null,
                },
              });
            }
          }
        }

        // Update wallet with new risk score and last checked time
        const { error: updateError } = await supabaseClient
          .from('watched_wallets')
          .update({
            current_risk_score: newRiskScore,
            last_checked: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);

        if (updateError) {
          console.error('Error updating wallet:', updateError);
        }

      } catch (walletError) {
        console.error(`Error monitoring wallet ${wallet.wallet_address}:`, walletError);
      }
    }

    console.log(`Monitoring complete. Generated ${alerts.length} alerts.`);

    return new Response(
      JSON.stringify({
        message: `Monitored ${watchedWallets.length} wallets`,
        alerts_generated: alerts.length,
        alerts: alerts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in wallet monitoring:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
