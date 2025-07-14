
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // Get the API keys from Deno environment (Supabase secrets)
    const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY')
    
    if (!etherscanApiKey) {
      console.warn('ETHERSCAN_API_KEY not found in environment')
    }

    return new Response(
      JSON.stringify({
        etherscanApiKey: etherscanApiKey || null
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error getting API keys:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get API keys' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
