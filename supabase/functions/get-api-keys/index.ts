
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
    // This endpoint has been deprecated for security reasons.
    // API keys must never be exposed to the client.
    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'Deprecated endpoint. Use the etherscan-proxy function instead.'
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 403,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown'
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
