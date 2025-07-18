
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

      // Call our Edge Function which will handle the AI summary generation
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

      console.log('✅ Successfully generated AI summary');

      // Since we're now generating summaries synchronously, 
      // we can immediately reload the summary data
      await loadExistingSummary(recordId);

      toast({
        title: "AI Summary Complete",
        description: "Your AI summary has been generated successfully!",
      });

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
    } finally {
      setIsGenerating(false);
    }
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
