
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Sending report to webhook...');
    
    // Get the report data from the request body
    const reportData = await req.json();
    
    console.log('📋 Report data received:', {
      recordId: reportData.recordId,
      reportType: reportData.reportType,
      timestamp: reportData.timestamp
    });

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
