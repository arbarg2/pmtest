
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      // Call our Edge Function which will trigger the Tines webhook
      console.log('📤 Calling AI summary Edge Function');
      const { data, error } = await supabase.functions.invoke('ai-summary', {
        body: {
          action: 'generate',
          record_id: recordId,
          wallet_data: walletData
        }
      });

      if (error) {
        throw new Error(`Edge Function failed: ${error.message}`);
      }

      console.log('✅ AI summary generation initiated via Tines webhook');

      toast({
        title: "AI Summary Started",
        description: "Holly is analyzing your data. This may take a few moments...",
      });

      // Start polling for the completed summary
      pollForSummaryCompletion(recordId);

    } catch (error) {
      console.error('❌ Error generating AI summary:', error);
      
      // Reset status on error
      await supabase
        .from('investigation_records')
        .update({ ai_summary_status: 'failed' })
        .eq('record_id', recordId);

      toast({
        title: "AI Summary Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI summary. Please try again.",
        variant: "destructive",
      });
      
      setIsGenerating(false);
    }
  };

  const pollForSummaryCompletion = async (recordId: string) => {
    console.log('🔄 Starting to poll for AI summary completion...');
    
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('investigation_records')
          .select('ai_summary, ai_summary_previous, ai_summary_generated_at, ai_summary_status')
          .eq('record_id', recordId)
          .single();

        if (error) {
          console.error('Error polling for summary:', error);
          return;
        }

        if (data) {
          setSummaryData(data);
          
          // Check if summary is completed or failed
          if (data.ai_summary_status === 'completed') {
            console.log('✅ AI summary completed!');
            clearInterval(pollInterval);
            setIsGenerating(false);
            
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
              description: "The AI summary generation failed. Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error during polling:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isGenerating) {
        setIsGenerating(false);
        toast({
          title: "AI Summary Timeout",
          description: "The AI summary is taking longer than expected. Please try again.",
          variant: "destructive",
        });
      }
    }, 300000); // 5 minutes timeout
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
