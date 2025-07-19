
import { useState, useCallback, useRef } from 'react';
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
  
  // Refs must be declared at the top level consistently
  const successToastShown = useRef<Set<string>>(new Set());
  const loadingRecords = useRef<Set<string>>(new Set());

  const generateAISummary = async (recordId: string, walletData: any) => {
    if (!recordId) {
      console.error('❌ No record ID provided for AI summary generation');
      toast({
        title: "Error",
        description: "No record ID available. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    console.log('🤖 Starting AI summary generation for record:', recordId);

    try {
      // Verify the record exists first
      console.log('🔍 Verifying record exists before AI generation...');
      const { data: existingRecord, error: verifyError } = await supabase
        .from('investigation_records')
        .select('id, record_id, ai_summary_status')
        .eq('id', recordId)
        .maybeSingle();

      if (verifyError) {
        console.error('❌ Error verifying record:', verifyError);
        throw new Error(`Failed to verify record: ${verifyError.message}`);
      }

      if (!existingRecord) {
        console.error('❌ Record not found during verification:', recordId);
        throw new Error('Record not found. Please refresh the page and try again.');
      }

      console.log('✅ Record verified:', existingRecord);

      // Check if already processing
      if (existingRecord.ai_summary_status === 'processing') {
        console.log('⚠️ AI summary already processing for this record');
        toast({
          title: "AI Summary In Progress",
          description: "An AI summary is already being generated for this record.",
        });
        
        // Start polling for completion
        pollForSummaryCompletion(recordId);
        return;
      }

      // Mark the record as processing
      const { error: statusError } = await supabase
        .from('investigation_records')
        .update({ ai_summary_status: 'processing' })
        .eq('id', recordId);

      if (statusError) {
        console.error('❌ Error updating status to processing:', statusError);
        throw new Error(`Failed to update status: ${statusError.message}`);
      }

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
        console.error('❌ Edge Function error:', error);
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
      try {
        await supabase
          .from('investigation_records')
          .update({ ai_summary_status: 'failed' })
          .eq('id', recordId);
      } catch (statusError) {
        console.error('❌ Error updating status to failed:', statusError);
      }

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
    
    let pollCount = 0;
    const maxPolls = 100; // 5 minutes at 3-second intervals
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        console.log(`🔄 Polling attempt ${pollCount}/${maxPolls}`);
        
        const { data, error } = await supabase
          .from('investigation_records')
          .select('ai_summary, ai_summary_previous, ai_summary_generated_at, ai_summary_status')
          .eq('id', recordId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error polling for summary:', error);
          
          // Don't fail immediately on polling errors, just log and continue
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            toast({
              title: "AI Summary Timeout",
              description: "Unable to check summary status. Please refresh to see if it completed.",
              variant: "destructive",
            });
          }
          return;
        }

        if (data) {
          setSummaryData(data);
          
          // Check if summary is completed or failed
          if (data.ai_summary_status === 'completed') {
            console.log('✅ AI summary completed!');
            clearInterval(pollInterval);
            setIsGenerating(false);
            
            // Only show success toast once per record
            if (!successToastShown.current.has(recordId)) {
              successToastShown.current.add(recordId);
              toast({
                title: "AI Summary Complete",
                description: "Your AI summary has been generated successfully!",
              });
            }
          } else if (data.ai_summary_status === 'failed') {
            console.log('❌ AI summary failed');
            clearInterval(pollInterval);
            setIsGenerating(false);
            
            toast({
              title: "AI Summary Failed",
              description: "The AI summary generation failed. Please try again.",
              variant: "destructive",
            });
          } else if (pollCount >= maxPolls) {
            // Timeout reached
            console.log('⏰ Polling timeout reached');
            clearInterval(pollInterval);
            setIsGenerating(false);
            
            toast({
              title: "AI Summary Timeout",
              description: "The AI summary is taking longer than expected. It may still complete in the background.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('❌ Error during polling:', error);
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setIsGenerating(false);
          
          toast({
            title: "AI Summary Error",
            description: "Error checking summary status. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
    }, 3000); // Poll every 3 seconds
  };

  const loadExistingSummary = useCallback(async (recordId: string) => {
    if (!recordId) {
      console.log('⚠️ No record ID provided for loading existing summary');
      return;
    }

    // Prevent duplicate loading calls
    if (loadingRecords.current.has(recordId)) {
      console.log('🔄 Already loading summary for record:', recordId);
      return;
    }

    loadingRecords.current.add(recordId);

    try {
      console.log('📖 Loading existing summary for record:', recordId);
      
      const { data, error } = await supabase
        .from('investigation_records')
        .select('ai_summary, ai_summary_previous, ai_summary_generated_at, ai_summary_status')
        .eq('id', recordId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading existing summary:', error);
        return;
      }

      if (data) {
        console.log('✅ Loaded existing summary data:', {
          has_summary: !!data.ai_summary,
          has_previous: !!data.ai_summary_previous,
          status: data.ai_summary_status,
          generated_at: data.ai_summary_generated_at
        });
        
        setSummaryData(data);
        
        // If status is processing, start polling
        if (data.ai_summary_status === 'processing') {
          console.log('🔄 Found processing status, starting polling...');
          setIsGenerating(true);
          pollForSummaryCompletion(recordId);
        }
      } else {
        console.log('⚠️ No existing summary data found');
      }
    } catch (error) {
      console.error('❌ Error loading existing summary:', error);
    } finally {
      // Always remove from loading set when done
      loadingRecords.current.delete(recordId);
    }
  }, []);

  return {
    isGenerating,
    summaryData,
    generateAISummary,
    loadExistingSummary,
    setSummaryData
  };
};
