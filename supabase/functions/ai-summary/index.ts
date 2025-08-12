
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tines-signature',
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isUUID(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  console.log('🚀 AI Summary endpoint called with method:', req.method)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Read raw body for signature verification
    const rawBody = await req.text();
    let body: any = {};
    try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { body = {}; }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generation request: require user auth and ownership
    if (body.recordId && body.walletData) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const recordId = body.recordId as string;
      const isId = isUUID(recordId);

      let query = userClient.from('investigation_records').select('id, record_id').limit(1);
      const { data: owned, error: ownErr } = isId
        ? await query.eq('id', recordId)
        : await query.eq('record_id', recordId);

      if (ownErr || !owned || owned.length === 0) {
        console.warn('Record verification/ownership failed', { ownErr, recordId });
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const svc = createClient(supabaseUrl, serviceKey);

      const tinesWebhookUrl = Deno.env.get('TINES_AI_WEBHOOK_URL');
      if (!tinesWebhookUrl) {
        console.error('TINES_AI_WEBHOOK_URL is not configured');
        return new Response(JSON.stringify({ error: 'Server not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const webhookPayload = {
        record_id: owned[0].id, // UUID for callback
        wallet_data: body.walletData,
        callback_url: `${supabaseUrl}/functions/v1/ai-summary`
      }

      const webhookResponse = await fetch(tinesWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      })

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error('❌ Tines webhook failed:', webhookResponse.status, errorText)
        throw new Error(`Tines webhook failed: ${webhookResponse.status} - ${errorText}`)
      }

      const webhookResult = await webhookResponse.json()

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'AI summary generation initiated',
          record_id: owned[0].record_id,
          webhook_response: webhookResult
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Callback from Tines: require signature verification
    if (body.record_id && body.ai_summary) {
      const signature = req.headers.get('x-tines-signature') || '';
      const secret = Deno.env.get('TINES_WEBHOOK_SECRET') || '';
      if (!secret) {
        console.error('TINES_WEBHOOK_SECRET not set');
        return new Response(JSON.stringify({ error: 'Server not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const calc = await hmacSha256Hex(secret, rawBody || '');
      const provided = signature.trim();
      if (!provided || (provided !== calc && provided !== btoa(String.fromCharCode(...calc.match(/.{1,2}/g)!.map(h=>parseInt(h,16)) as unknown as number[])))) {
        console.warn('Invalid or missing signature');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const svc = createClient(supabaseUrl, serviceKey)

      // Retry logic for fetching the current record
      let currentRecord: any = null;
      let fetchError: any = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { data, error } = await svc
            .from('investigation_records')
            .select('ai_summary')
            .eq('id', body.record_id)
            .maybeSingle()

          if (error) {
            fetchError = error;
            if (attempt < MAX_RETRIES) {
              await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
              continue;
            }
          } else {
            currentRecord = data;
            fetchError = null;
            break;
          }
        } catch (networkError) {
          fetchError = networkError;
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
          }
        }
      }

      if (fetchError || !currentRecord) {
        return new Response(
          JSON.stringify({ error: 'Record not found after retries', details: fetchError?.message || 'Unknown' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateData: any = {
        ai_summary: body.ai_summary,
        ai_summary_generated_at: new Date().toISOString(),
        ai_summary_status: 'completed'
      }

      if (currentRecord.ai_summary) {
        updateData.ai_summary_previous = currentRecord.ai_summary
      }

      let updateError: any = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { error } = await svc
            .from('investigation_records')
            .update(updateData)
            .eq('id', body.record_id)

          if (error) {
            updateError = error;
            if (attempt < MAX_RETRIES) {
              await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
              continue;
            }
          } else {
            updateError = null;
            break;
          }
        } catch (networkError) {
          updateError = networkError;
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
          }
        }
      }

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update record after retries', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'AI summary updated successfully', record_id: body.record_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request payload', details: 'Expected generation (recordId + walletData) or callback (record_id + ai_summary)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Unexpected error in ai-summary function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
