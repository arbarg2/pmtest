
import { useState } from 'react';
import { toast } from 'sonner';
import { enhancedWalletAPI } from '@/services/enhancedApi';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService } from '@/services/riskFactors';
import { progressiveAnalysisService } from '@/services/progressiveAnalysis';
import { cacheService } from '@/services/cacheService';
import { backgroundProcessor } from '@/services/backgroundProcessor';
import { WalletRiskResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useWalletAnalysis = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<WalletRiskResponse | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<any>(null);

  const analyzeWallet = async (walletAddress: string, network: string = 'bitcoin') => {
    if (!user) {
      toast.error('Please log in to perform wallet analysis');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress(null);
    
    try {
      console.log('🚀 Starting progressive wallet analysis for:', walletAddress);
      
      // Use progressive analysis for better UX
      const result = await progressiveAnalysisService.analyzeWithProgressiveLoading(
        walletAddress,
        (progressState) => {
          setAnalysisProgress(progressState);
          
          // Update analysis data with partial results
          if (progressState.partialResult) {
            setAnalysisData(progressState.partialResult);
          } else if (progressState.finalResult) {
            setAnalysisData(progressState.finalResult);
          }
        }
      );
      
      if (!result) {
        throw new Error('No analysis result received');
      }

      console.log('✅ Progressive analysis completed:', result);

      // Queue background processing jobs
      console.log('📋 Queuing background processing jobs...');
      
      try {
        // Save to database in background (high priority)
        await backgroundProcessor.addJob('database_storage', {
          address: walletAddress,
          network,
          result,
          userId: user.id
        }, 3);

        // Process risk factors in background (medium priority)
        const recordId = result.lookupId || `temp_${Date.now()}`;
        await backgroundProcessor.addJob('risk_factors', {
          recordId,
          walletData: result
        }, 2);

        // Screen sanctions in background (medium priority)
        await backgroundProcessor.addJob('sanctions_screening', {
          recordId,
          address: walletAddress,
          network
        }, 2);

        console.log('✅ Background jobs queued successfully');
      } catch (bgError) {
        console.error('❌ Background job queuing failed:', bgError);
      }

      // Create enhanced result with record ID
      const enhancedResult = {
        ...result,
        recordId: result.lookupId || `temp_${Date.now()}`,
        isTemporary: false
      };
      
      setAnalysisData(enhancedResult);
      toast.success('Wallet analysis completed successfully');
      
      // Record performance metrics
      cacheService.recordApiCall(result.processing_time_ms);
      
      return enhancedResult;
      
    } catch (error) {
      console.error('❌ Progressive wallet analysis failed:', error);
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
      throw error;
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  const generateReport = (walletAddress: string) => {
    toast.info('Report generation initiated for ' + walletAddress);
  };

  const getCacheStats = () => cacheService.getCacheStats();
  const getQueueStats = () => backgroundProcessor.getQueueStats();

  return {
    isAnalyzing,
    analyzeWallet,
    generateReport,
    analysisData,
    analysisProgress,
    getCacheStats,
    getQueueStats,
  };
};
