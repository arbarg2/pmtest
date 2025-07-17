
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('AI Summary endpoint called');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client with service role key for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    console.log('Request payload:', JSON.stringify(requestData, null, 2));

    const { record_id, ai_summary } = requestData;

    if (!record_id || !ai_summary) {
      console.error('Missing required fields:', { record_id: !!record_id, ai_summary: !!ai_summary });
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: record_id and ai_summary are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing AI summary update for record:', record_id);

    // First, get the current record to preserve the existing summary as previous
    const { data: existingRecord, error: fetchError } = await supabase
      .from('investigation_records')
      .select('ai_summary')
      .eq('record_id', record_id)
      .single();

    if (fetchError) {
      console.error('Error fetching existing record:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Record not found',
        details: fetchError.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare update data - move current summary to previous if it exists
    const updateData = {
      ai_summary: ai_summary,
      ai_summary_generated_at: new Date().toISOString(),
      ai_summary_status: 'completed',
      ...(existingRecord?.ai_summary && { ai_summary_previous: existingRecord.ai_summary })
    };

    console.log('Updating record with data:', updateData);

    // Update the record with the new AI summary
    const { data, error } = await supabase
      .from('investigation_records')
      .update(updateData)
      .eq('record_id', record_id)
      .select();

    if (error) {
      console.error('Error updating record:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to update record',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully updated record:', data);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'AI summary updated successfully',
      record_id: record_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in ai-summary function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
