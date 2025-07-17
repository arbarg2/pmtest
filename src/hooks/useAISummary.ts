
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// TODO: Replace with your actual Tines webhook URL
// Example: 'https://your-tines-instance.tines.com/webhook/your-webhook-id'
const TINES_WEBHOOK_URL = 'https://hooks.tines.com/webhook/your-webhook-id-here';
const AI_SUMMARY_ENDPOINT = 'https://edjkvebuxfxoylzgoddi.supabase.co/functions/v1/ai-summary';

export interface AISummaryData {
  ai_summary: string | null;
  ai_summary_previous: string | null;
  ai_summary_generated_at: string | null;
  ai_summary_status: string | null;
}

export const useAISummary = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState<AISummaryData>({
    ai_summary: null,
    ai_summary_previous: null,
    ai_summary_generated_at: null,
    ai_summary_status: null
  });
  const { toast } = useToast();

  const generateAISummary = async (recordId: string, walletData: any) => {
    setIsGenerating(true);
    console.log('🤖 Starting AI summary generation for record:', recordId);

    try {
      // First, mark the record as processing
      await supabase
        .from('investigation_records')
        .update({ ai_summary_status: 'processing' })
        .eq('record_id', recordId);

      // Check if webhook URL is configured
      if (TINES_WEBHOOK_URL.includes('your-webhook-id-here')) {
        throw new Error('Please configure your Tines webhook URL in src/hooks/useAISummary.ts');
      }

      // Send data to Tines webhook
      const tinesPayload = {
        record_id: recordId,
        wallet_data: walletData,
        timestamp: new Date().toISOString(),
        callback_url: AI_SUMMARY_ENDPOINT
      };

      console.log('📤 Sending data to Tines webhook:', TINES_WEBHOOK_URL);
      console.log('📋 Payload:', tinesPayload);

      const tinesResponse = await fetch(TINES_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tinesPayload),
      });

      if (!tinesResponse.ok) {
        throw new Error(`Tines webhook failed: ${tinesResponse.statusText}`);
      }

      console.log('✅ Successfully sent data to Tines');

      // Start polling for the AI summary result
      startPolling(recordId);

      toast({
        title: "AI Summary Requested",
        description: "Your AI summary is being generated. Please wait...",
      });

    } catch (error) {
      console.error('❌ Error generating AI summary:', error);
      setIsGenerating(false);
      
      // Reset status on error
      await supabase
        .from('investigation_records')
        .update({ ai_summary_status: 'failed' })
        .eq('record_id', recordId);

      toast({
        title: "AI Summary Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI summary",
        variant: "destructive",
      });
    }
  };

  const startPolling = (recordId: string) => {
    console.log('🔄 Starting polling for AI summary result');
    
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('investigation_records')
          .select('ai_summary, ai_summary_previous, ai_summary_generated_at, ai_summary_status')
          .eq('record_id', recordId)
          .single();

        if (error) {
          console.error('Error polling for AI summary:', error);
          return;
        }

        console.log('📊 Polling result:', data);

        if (data.ai_summary_status === 'completed' && data.ai_summary) {
          console.log('✅ AI summary completed!');
          clearInterval(pollInterval);
          setIsGenerating(false);
          setSummaryData(data);
          
          toast({
            title: "AI Summary Complete",
            description: "Your AI summary has been generated successfully!",
          });
        } else if (data.ai_summary_status === 'failed') {
          console.log('❌ AI summary failed');
          clearInterval(pollInterval);
          setIsGenerating(false);
          
          toast({
            title: "AI Summary Failed",
            description: "Failed to generate AI summary. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error in polling:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isGenerating) {
        setIsGenerating(false);
        toast({
          title: "AI Summary Timeout",
          description: "AI summary generation timed out. Please try again.",
          variant: "destructive",
        });
      }
    }, 300000); // 5 minutes
  };

  const loadExistingSummary = async (recordId: string) => {
    try {
      const { data, error } = await supabase
        .from('investigation_records')
        .select('ai_summary, ai_summary_previous, ai_summary_generated_at, ai_summary_status')
        .eq('record_id', recordId)
        .single();

      if (error) {
        console.error('Error loading existing summary:', error);
        return;
      }

      if (data) {
        setSummaryData(data);
      }
    } catch (error) {
      console.error('Error loading existing summary:', error);
    }
  };

  return {
    isGenerating,
    summaryData,
    generateAISummary,
    loadExistingSummary,
    setSummaryData
  };
};
