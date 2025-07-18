
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

        console.log('🌐 Calling Tines webhook for AI summary generation...')
        
        // Call the Tines webhook
        const tinesWebhookUrl = 'https://pat.tines.com/webhook/aml-buddy-bot/d944814a4370670941138b195459ae7e'
        
        const webhookPayload = {
          record_id: record_id,
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

        console.log('🔍 Looking up record:', record_id)

        // First, get the current record to preserve the previous summary
        const { data: currentRecord, error: fetchError } = await supabase
          .from('investigation_records')
          .select('ai_summary')
          .eq('record_id', record_id)
          .single()

        if (fetchError) {
          console.error('❌ Error fetching current record:', fetchError)
          return new Response(
            JSON.stringify({ error: 'Record not found' }),
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

        // Update the record with the AI summary
        const { error: updateError } = await supabase
          .from('investigation_records')
          .update(updateData)
          .eq('record_id', record_id)

        if (updateError) {
          console.error('❌ Error updating record:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update record' }),
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
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
