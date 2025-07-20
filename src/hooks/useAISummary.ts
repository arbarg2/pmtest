
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAISummary = () => {
  const [summary, setSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const successToastShown = useRef<Set<string>>(new Set());
  const loadingRecords = useRef<Set<string>>(new Set());

  const generateAISummary = async (recordIdOrUuid: string, walletData: any) => {
    if (!recordIdOrUuid) {
      console.error('❌ No record ID provided for AI summary generation');
      toast({
        title: "Error",
        description: "No record ID provided for AI summary generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    console.log('🤖 Starting AI summary generation for record:', recordIdOrUuid);

    try {
      // Verify the record exists first - handle both UUID and record_id
      console.log('🔍 Verifying record exists before AI generation...');
      
      // Check if it's a UUID or record_id string
      const isUuid = recordIdOrUuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      let query = supabase
        .from('investigation_records')
        .select('id, record_id, ai_summary_status');
      
      if (isUuid) {
        query = query.eq('id', recordIdOrUuid);
      } else {
        query = query.eq('record_id', recordIdOrUuid);
      }
      
      const { data: existingRecord, error: verifyError } = await query.maybeSingle();

      if (verifyError) {
        console.error('❌ Error verifying record:', verifyError);
        throw verifyError;
      }

      if (!existingRecord) {
        console.error('❌ Record not found during verification:', recordIdOrUuid);
        throw new Error('Record not found. Please refresh the page and try again.');
      }

      console.log('✅ Record verified, current AI status:', existingRecord.ai_summary_status);

      // Check if AI summary is already being processed
      if (existingRecord.ai_summary_status === 'processing') {
        console.log('⏳ AI summary already processing for record:', existingRecord.id);
        toast({
          title: "AI Summary In Progress",
          description: "An AI summary is already being generated for this record.",
        });
        
        // Start polling for completion using the UUID
        pollForSummaryCompletion(existingRecord.id);
        return;
      }

      // Update status to processing
      const { error: statusError } = await supabase
        .from('investigation_records')
        .update({ ai_summary_status: 'processing' })
        .eq('id', existingRecord.id);

      if (statusError) {
        console.error('❌ Error updating status to processing:', statusError);
        throw statusError;
      }

      // Call the edge function with record_id (string) - this is what the edge function expects
      console.log('🚀 Calling edge function with record_id:', existingRecord.record_id);
      const { data, error } = await supabase.functions.invoke('ai-summary', {
        body: { 
          recordId: existingRecord.record_id, // Use record_id string for edge function
          walletData 
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('✅ Edge function called successfully:', data);

      toast({
        title: "AI Analysis Started",
        description: "Holly is analyzing your data. This may take a few moments...",
      });

      // Start polling for the completed summary using the UUID
      pollForSummaryCompletion(existingRecord.id);

    } catch (error) {
      console.error('❌ Error generating AI summary:', error);
      
      // Reset status on error - we need to get the UUID first if we have a record_id
      try {
        const isUuid = recordIdOrUuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        
        if (isUuid) {
          await supabase
            .from('investigation_records')
            .update({ ai_summary_status: 'failed' })
            .eq('id', recordIdOrUuid);
        } else {
          await supabase
            .from('investigation_records')
            .update({ ai_summary_status: 'failed' })
            .eq('record_id', recordIdOrUuid);
        }
      } catch (statusError) {
        console.error('❌ Error updating status to failed:', statusError);
      }

      setIsGenerating(false);
      toast({
        title: "AI Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadExistingSummary = async (recordIdOrUuid: string) => {
    if (!recordIdOrUuid || loadingRecords.current.has(recordIdOrUuid)) {
      return;
    }

    try {
      loadingRecords.current.add(recordIdOrUuid);
      console.log('📖 Loading existing AI summary for record:', recordIdOrUuid);

      // Check if it's a UUID or record_id string
      const isUuid = recordIdOrUuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      let query = supabase
        .from('investigation_records')
        .select('id, record_id, ai_summary, ai_summary_status');
      
      if (isUuid) {
        query = query.eq('id', recordIdOrUuid);
      } else {
        query = query.eq('record_id', recordIdOrUuid);
      }
      
      const { data: record, error } = await query.maybeSingle();

      if (error) {
        console.error('❌ Error loading existing summary:', error);
        return;
      }

      if (!record) {
        console.error('❌ Record not found when loading summary:', recordIdOrUuid);
        return;
      }

      console.log('📊 Record found, AI status:', record.ai_summary_status);

      if (record.ai_summary) {
        console.log('✅ Found existing AI summary');
        setSummary(record.ai_summary);
      } else if (record.ai_summary_status === 'processing') {
        console.log('⏳ AI summary is being processed, starting polling');
        setIsGenerating(true);
        pollForSummaryCompletion(record.id); // Use UUID for polling
      }
    } catch (error) {
      console.error('❌ Error in loadExistingSummary:', error);
    } finally {
      loadingRecords.current.delete(recordIdOrUuid);
    }
  };

  const pollForSummaryCompletion = async (recordUuid: string, maxAttempts: number = 30) => {
    console.log('🔄 Starting polling for AI summary completion, UUID:', recordUuid);
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        console.log(`🔄 Polling attempt ${attempts}/${maxAttempts} for record UUID:`, recordUuid);

        const { data: record, error } = await supabase
          .from('investigation_records')
          .select('ai_summary, ai_summary_status')
          .eq('id', recordUuid) // Always use UUID for polling
          .maybeSingle();

        if (error) {
          console.error('❌ Polling error:', error);
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000);
          } else {
            setIsGenerating(false);
          }
          return;
        }

        if (!record) {
          console.error('❌ Record not found during polling');
          setIsGenerating(false);
          return;
        }

        console.log('📊 Polling status:', record.ai_summary_status);

        if (record.ai_summary_status === 'completed' && record.ai_summary) {
          console.log('✅ AI summary completed!');
          setSummary(record.ai_summary);
          setIsGenerating(false);
          
          if (!successToastShown.current.has(recordUuid)) {
            successToastShown.current.add(recordUuid);
            toast({
              title: "AI Analysis Complete",
              description: "Holly has finished analyzing your data!",
            });
          }
        } else if (record.ai_summary_status === 'failed') {
          console.error('❌ AI summary failed');
          setIsGenerating(false);
          toast({
            title: "AI Analysis Failed",
            description: "Holly encountered an error while analyzing your data. Please try again.",
            variant: "destructive",
          });
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          console.log('⏰ Polling timeout reached');
          setIsGenerating(false);
          toast({
            title: "Analysis Taking Longer Than Expected",
            description: "Holly is still working on your analysis. Please check back in a few minutes.",
          });
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setIsGenerating(false);
        }
      }
    };

    poll();
  };

  return {
    summary,
    setSummary,
    isGenerating,
    generateAISummary,
    loadExistingSummary,
  };
};
