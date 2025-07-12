
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

        // Simulate re-analysis (in real implementation, call actual risk API)
        // For demo purposes, we'll simulate some risk score changes
        const mockNewRiskScore = wallet.current_risk_score + (Math.random() - 0.5) * 2;
        const newRiskScore = Math.max(0, Math.min(10, mockNewRiskScore));
        const riskChange = Math.abs(newRiskScore - wallet.current_risk_score);

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
