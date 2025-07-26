
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISummaryData {
  id: string;
  record_id: string;
  ai_summary: string | null;
  ai_summary_status: 'pending' | 'completed' | 'failed';
  ai_summary_generated_at: string | null;
  ai_summary_previous: string | null;
}

export const useAISummary = (recordId?: string) => {
  const [summaryData, setSummaryData] = useState<AISummaryData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const lastRecordIdRef = useRef<string | undefined>();

  // Helper function to determine query strategy
  const buildQuery = (id: string) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase
      .from('investigation_records')
      .select('id, record_id, ai_summary, ai_summary_status, ai_summary_generated_at, ai_summary_previous');
    
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('record_id', id);
    }
    
    return query;
  };

  // Load existing summary with proper debouncing
  useEffect(() => {
    if (!recordId || loadingRef.current || lastRecordIdRef.current === recordId) {
      return;
    }

    const loadExistingSummary = async () => {
      if (loadingRef.current) return;
      
      loadingRef.current = true;
      setIsLoading(true);
      lastRecordIdRef.current = recordId;

      try {
        console.log('📖 Loading existing AI summary for record:', recordId);
        
        const { data, error } = await buildQuery(recordId).single();

        if (error) {
          console.error('Error loading AI summary:', error);
          return;
        }

        if (data) {
          console.log('📊 Record found, AI status:', data.ai_summary_status);
          // Ensure the status is properly typed
          const normalizedStatus = data.ai_summary_status === 'processing' ? 'pending' : 
                                  (data.ai_summary_status as 'pending' | 'completed' | 'failed');
          
          setSummaryData({
            ...data,
            ai_summary_status: normalizedStatus
          });
        }
      } catch (error) {
        console.error('Failed to load AI summary:', error);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    // Add a small delay to prevent rapid consecutive calls
    const timeoutId = setTimeout(loadExistingSummary, 100);
    
    return () => clearTimeout(timeoutId);
  }, [recordId]);

  const generateSummary = async (walletData: any) => {
    if (!recordId || isGenerating) return;

    setIsGenerating(true);
    
    try {
      console.log('🤖 Generating AI summary for record:', recordId);
      
      // Update status to pending immediately for better UX
      setSummaryData(prev => prev ? { ...prev, ai_summary_status: 'pending' } : null);
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recordId);
      
      let updateQuery = supabase
        .from('investigation_records')
        .update({ ai_summary_status: 'pending' });
      
      if (isUUID) {
        updateQuery = updateQuery.eq('id', recordId);
      } else {
        updateQuery = updateQuery.eq('record_id', recordId);
      }

      await updateQuery;

      // Call the Edge Function to generate summary
      const { data, error } = await supabase.functions.invoke('ai-summary', {
        body: { recordId, walletData }
      });

      if (error) {
        throw error;
      }

      console.log('✅ AI summary generated successfully');
      
      // Add a small delay to ensure the database has been updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload the summary data with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data: updatedData } = await buildQuery(recordId).single();

          if (updatedData && updatedData.ai_summary_status === 'completed') {
            const normalizedStatus = updatedData.ai_summary_status === 'processing' ? 'pending' : 
                                    (updatedData.ai_summary_status as 'pending' | 'completed' | 'failed');
            
            setSummaryData({
              ...updatedData,
              ai_summary_status: normalizedStatus
            });
            break;
          } else {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`🔄 Retrying data fetch (${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (retryError) {
          console.error('Retry error:', retryError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      toast.success('AI analysis completed successfully');
    } catch (error) {
      console.error('❌ AI summary generation failed:', error);
      
      // Update status to failed
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recordId);
      
      let failedQuery = supabase
        .from('investigation_records')
        .update({ ai_summary_status: 'failed' });
      
      if (isUUID) {
        failedQuery = failedQuery.eq('id', recordId);
      } else {
        failedQuery = failedQuery.eq('record_id', recordId);
      }

      await failedQuery;
      
      // Update local state immediately
      setSummaryData(prev => prev ? { ...prev, ai_summary_status: 'failed' } : null);
        
      toast.error('Failed to generate AI analysis');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    summaryData,
    isGenerating,
    isLoading,
    generateSummary
  };
};
