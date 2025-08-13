
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
    console.log('🔑 Getting API keys from environment...');
    
    // Get the API keys from Deno environment (Supabase secrets)
    const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY')
    
    console.log('Available environment variables:', Object.keys(Deno.env.toObject()));
    
    if (!etherscanApiKey) {
      console.warn('⚠️ ETHERSCAN_API_KEY not found in environment');
    } else {
      console.log('✅ ETHERSCAN_API_KEY found');
    }

    return new Response(
      JSON.stringify({
        etherscanApiKey: etherscanApiKey || null,
        status: 'success'
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error getting API keys:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get API keys',
        details: error.message,
        status: 'error'
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500,
      },
    )
  }
})
