import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawData = await req.json();
    const reportData = {
      recordId: rawData?.recordId ? String(rawData.recordId).slice(0, 200) : null,
      reportType: rawData?.reportType ? String(rawData.reportType).slice(0, 80) : null,
      timestamp: rawData?.timestamp ? String(rawData.timestamp).slice(0, 64) : new Date().toISOString(),
      userId: claims.claims.sub,
    };

    // Send the data to the Tines webhook
    const webhookUrl = 'https://pat.tines.com/webhook/aml-buddy-bot-2/010e55b671e752ae9888806bfb8d0e2d';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (response.ok) {
      console.log('✅ Report sent successfully to webhook');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Report sent successfully to webhook'
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          status: 200,
        },
      );
    } else {
      console.error('❌ Webhook request failed:', response.status, response.statusText);
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error sending report:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to send report',
        details: error.message
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500,
      },
    );
  }
});
