
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
      console.log('📥 Received payload')

      // Check if this is a generation request (has recordId and walletData) or a callback (has record_id and ai_summary)
      if (body.recordId && body.walletData) {
        // Require authenticated user for generation
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const userClient = createClient(
          supabaseUrl,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data: claims, error: authErr } = await userClient.auth.getClaims(
          authHeader.replace('Bearer ', ''),
        );
        if (authErr || !claims?.claims?.sub) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const userId = claims.claims.sub as string;

        const { recordId, walletData } = body

        // Check if this is a demo record
        const isDemoRecord = recordId.startsWith('demo_');
        
        if (isDemoRecord) {
          console.log('🎭 Processing demo record - generating mock AI summary')
          
          // Generate a mock AI summary for demo records
          const mockAISummary = `# AI Analysis Summary for Demo Wallet

## Executive Summary
This wallet demonstrates **high-volume trading activity** with a substantial Bitcoin balance. The address appears to be associated with a commercial exchange operation based on transaction patterns and volume metrics.

## Risk Assessment
- **Overall Risk Score**: ${walletData.risk_score}/10 (${walletData.risk_level})
- **Confidence Level**: 85%
- **Primary Risk Factors**: High transaction frequency, large balance holdings

## Key Findings

### 🎯 Entity Classification
- **Type**: ${walletData.entity_attribution?.name || 'Commercial Exchange'}
- **Category**: ${walletData.entity_attribution?.type || 'exchange'}
- **Confidence**: ${(walletData.entity_attribution?.confidence || 0.75) * 100}%

### 💰 Financial Profile
- **Current Balance**: ${walletData.asset_breakdown?.BITCOIN?.balance || 0} BTC
- **USD Equivalent**: $${(walletData.asset_breakdown?.BITCOIN?.usd_value || 0).toLocaleString()}
- **Transaction Count**: ${walletData.transaction_count?.toLocaleString() || 'N/A'}
- **Average Transaction Size**: ${walletData.volume_metrics?.average_transaction_size || 0} BTC

### 🛡️ Sanctions & Compliance
- **Sanctions Status**: ✅ Clean
- **Fraud Reports**: None identified
- **Regulatory Flags**: None detected

### 📊 Behavioral Analysis
The wallet exhibits characteristics typical of a **${walletData.behavioral_classification?.category || 'commercial exchange'}** operation:
- High-frequency transaction patterns
- Consistent inbound/outbound flow ratios
- Professional-grade operational security

### 🚨 Alerts & Recommendations
- **No immediate red flags detected**
- Consider enhanced monitoring due to high transaction volume
- Verify entity compliance with local regulations
- Monitor for unusual pattern changes

---
*Analysis completed using real-time blockchain data and advanced risk modeling algorithms.*`;

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Demo AI summary generated',
              ai_summary: mockAISummary,
              record_id: recordId,
              demo: true
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if recordId is a UUID or record_id string
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recordId);
        
        console.log('🔍 Verifying record exists:', recordId, 'isUUID:', isUUID)
        
        let query = supabase
          .from('investigation_records')
          .select('id, record_id');
        
        if (isUUID) {
          query = query.eq('id', recordId);
        } else {
          query = query.eq('record_id', recordId);
        }

        const { data: existingRecord, error: verifyError } = await query.maybeSingle();

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
        console.log('🤖 Generating AI summary via Lovable AI Gateway...')

        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
        if (!lovableApiKey) {
          throw new Error('LOVABLE_API_KEY not configured')
        }

        const prompt = `You are a senior blockchain compliance analyst. Produce a concise, professional AML/KYC risk summary in Markdown for the wallet below.

Wallet data (JSON):
${JSON.stringify(walletData, null, 2)}

Format the response with these sections:
## Executive Summary
## Risk Assessment (include risk score & level)
## Key Findings
### Entity Classification
### Financial Profile
### Sanctions & Compliance
### Behavioral Analysis
## Recommendations

Keep it under 600 words. Use bullet points where helpful. Do not invent numbers — only use what is in the data.`

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a senior blockchain AML compliance analyst.' },
              { role: 'user', content: prompt }
            ],
          }),
        })

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text()
          console.error('❌ AI Gateway failed:', aiResponse.status, errorText)
          throw new Error(`AI Gateway failed: ${aiResponse.status} - ${errorText}`)
        }

        const aiData = await aiResponse.json()
        const aiSummary = aiData.choices?.[0]?.message?.content

        if (!aiSummary) {
          throw new Error('No summary returned from AI Gateway')
        }

        console.log('✅ AI summary generated, saving to database...')

        // Get current summary to preserve as previous
        const { data: current } = await supabase
          .from('investigation_records')
          .select('ai_summary')
          .eq('id', existingRecord.id)
          .maybeSingle()

        const updatePayload: any = {
          ai_summary: aiSummary,
          ai_summary_generated_at: new Date().toISOString(),
          ai_summary_status: 'completed',
        }
        if (current?.ai_summary) {
          updatePayload.ai_summary_previous = current.ai_summary
        }

        const { error: saveError } = await supabase
          .from('investigation_records')
          .update(updatePayload)
          .eq('id', existingRecord.id)

        if (saveError) {
          console.error('❌ Failed to save AI summary:', saveError)
          throw new Error(`Failed to save: ${saveError.message}`)
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'AI summary generated',
            record_id: existingRecord.record_id,
            ai_summary: aiSummary,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else if (body.record_id && body.ai_summary) {
        // This is a callback from Tines with AI summary result
        console.log('🎯 Processing AI summary callback from Tines')
        
        const { record_id, ai_summary } = body

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
      } else {
        console.error('❌ Invalid request payload - missing required fields')
        return new Response(
          JSON.stringify({ 
            error: 'Invalid request payload',
            details: 'Expected either (recordId + walletData) for generation or (record_id + ai_summary) for callback'
          }),
          { 
            status: 400, 
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
