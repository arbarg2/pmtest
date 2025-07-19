
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  console.log('🚀 AI Summary endpoint called with method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('📥 Received payload:', body)
      
      // Check if this is a generation request or a callback
      if (body.action === 'generate') {
        console.log('🎯 Processing AI summary generation request')
        
        const { record_id, wallet_data } = body

        if (!record_id || !wallet_data) {
          console.error('❌ Missing required fields in generation request')
          return new Response(
            JSON.stringify({ error: 'record_id and wallet_data are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Verify the record exists before proceeding
        console.log('🔍 Verifying record exists:', record_id)
        const { data: existingRecord, error: verifyError } = await supabase
          .from('investigation_records')
          .select('id, record_id')
          .eq('record_id', record_id)
          .maybeSingle()

        if (verifyError || !existingRecord) {
          console.error('❌ Record verification failed:', verifyError || 'Record not found')
          return new Response(
            JSON.stringify({ error: 'Record not found or verification failed' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('✅ Record verified:', existingRecord)
        console.log('🌐 Calling Tines webhook for AI summary generation...')
        
        // Call the Tines webhook
        const tinesWebhookUrl = 'https://pat.tines.com/webhook/aml-buddy-bot/d944814a4370670941138b195459ae7e'
        
        const webhookPayload = {
          record_id: existingRecord.id, // Use the UUID for callback
          wallet_data: wallet_data,
          callback_url: `${supabaseUrl}/functions/v1/ai-summary`
        }

        console.log('📤 Sending webhook payload to Tines:', JSON.stringify(webhookPayload, null, 2))

        const webhookResponse = await fetch(tinesWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        })

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          console.error('❌ Tines webhook failed:', webhookResponse.status, errorText)
          throw new Error(`Tines webhook failed: ${webhookResponse.status} - ${errorText}`)
        }

        const webhookResult = await webhookResponse.json()
        console.log('✅ Tines webhook response:', webhookResult)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'AI summary generation initiated',
            record_id: record_id,
            webhook_response: webhookResult
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        // This is a callback from Tines with AI summary result
        console.log('🎯 Processing AI summary callback from Tines')
        
        const { record_id, ai_summary } = body

        if (!record_id) {
          console.error('❌ Missing record_id in callback')
          return new Response(
            JSON.stringify({ error: 'record_id is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        if (!ai_summary) {
          console.error('❌ Missing ai_summary in callback')
          return new Response(
            JSON.stringify({ error: 'ai_summary is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('🔍 Looking up record with retry logic:', record_id)

        // Retry logic for fetching the current record
        let currentRecord = null;
        let fetchError = null;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES} to fetch record`)
          
          try {
            const { data, error } = await supabase
              .from('investigation_records')
              .select('ai_summary')
              .eq('id', record_id)
              .maybeSingle()

            if (error) {
              fetchError = error;
              console.warn(`⚠️ Attempt ${attempt} failed:`, error);
              
              if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await sleep(delay);
                continue;
              }
            } else {
              currentRecord = data;
              fetchError = null;
              console.log(`✅ Successfully fetched record on attempt ${attempt}`);
              break;
            }
          } catch (networkError) {
            console.error(`❌ Network error on attempt ${attempt}:`, networkError);
            fetchError = networkError;
            
            if (attempt < MAX_RETRIES) {
              const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
              console.log(`⏳ Waiting ${delay}ms before retry...`);
              await sleep(delay);
            }
          }
        }

        if (fetchError || !currentRecord) {
          console.error('❌ Failed to fetch record after all retries:', fetchError)
          return new Response(
            JSON.stringify({ 
              error: 'Record not found after retries',
              details: fetchError?.message || 'Unknown error',
              record_id: record_id
            }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Prepare the update object
        const updateData: any = {
          ai_summary: ai_summary,
          ai_summary_generated_at: new Date().toISOString(),
          ai_summary_status: 'completed'
        }

        // If there was a previous summary, store it
        if (currentRecord.ai_summary) {
          updateData.ai_summary_previous = currentRecord.ai_summary
          console.log('💾 Storing previous summary for comparison')
        }

        console.log('💾 Updating record with AI summary...')

        // Retry logic for updating the record
        let updateError = null;
        let updateResult = null;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          console.log(`🔄 Update attempt ${attempt}/${MAX_RETRIES}`)
          
          try {
            const { data, error } = await supabase
              .from('investigation_records')
              .update(updateData)
              .eq('id', record_id)
              .select()
              .maybeSingle()

            if (error) {
              updateError = error;
              console.warn(`⚠️ Update attempt ${attempt} failed:`, error);
              
              if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await sleep(delay);
                continue;
              }
            } else {
              updateResult = data;
              updateError = null;
              console.log(`✅ Successfully updated record on attempt ${attempt}`);
              break;
            }
          } catch (networkError) {
            console.error(`❌ Network error on update attempt ${attempt}:`, networkError);
            updateError = networkError;
            
            if (attempt < MAX_RETRIES) {
              const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
              console.log(`⏳ Waiting ${delay}ms before retry...`);
              await sleep(delay);
            }
          }
        }

        if (updateError) {
          console.error('❌ Failed to update record after all retries:', updateError)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to update record after retries',
              details: updateError.message,
              record_id: record_id
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('✅ Successfully updated record with AI summary')

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'AI summary updated successfully',
            record_id: record_id 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error in ai-summary function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
