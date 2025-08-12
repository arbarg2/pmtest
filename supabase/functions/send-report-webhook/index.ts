
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function isUUID(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the report data from the request body
    const reportData = await req.json();

    // If a recordId is provided, verify the user owns this record via RLS
    const recordId = reportData?.recordId as string | undefined;
    if (recordId) {
      const query = supabase.from('investigation_records').select('id').limit(1);
      const { data, error } = isUUID(recordId)
        ? await query.eq('id', recordId)
        : await query.eq('record_id', recordId);

      if (error || !data || data.length === 0) {
        console.warn('Record ownership verification failed.', { error, recordId });
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const webhookUrl = Deno.env.get('TINES_REPORT_WEBHOOK_URL');
    if (!webhookUrl) {
      console.error('TINES_REPORT_WEBHOOK_URL is not configured');
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });

    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true, message: 'Report sent successfully to webhook' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const text = await response.text();
      console.error('Webhook request failed:', response.status, text);
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook request failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('❌ Error sending report:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to send report' }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      },
    );
  }
});
