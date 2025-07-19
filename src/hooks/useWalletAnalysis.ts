
import { useState } from 'react';
import { toast } from 'sonner';
import { enhancedWalletAPI } from '@/services/enhancedApi';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService } from '@/services/riskFactors';
import { WalletRiskResponse } from '@/services/api';

export const useWalletAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<WalletRiskResponse | null>(null);

  const analyzeWallet = async (walletAddress: string, network: string = 'bitcoin') => {
    setIsAnalyzing(true);
    
    try {
      console.log('🚀 Starting wallet analysis for:', walletAddress);
      
      // Perform the wallet analysis
      const result = await enhancedWalletAPI.analyzeWallet(walletAddress, network);
      
      if (!result) {
        throw new Error('No analysis result received');
      }

      console.log('✅ Analysis completed:', result);

      // Save the analysis to database
      console.log('💾 Saving analysis to database...');
      const saveResult = await supabaseLookupRecords.saveLookupRecord(result);
      
      if (saveResult.success && saveResult.recordId) {
        console.log('✅ Analysis saved with record ID:', saveResult.recordId);
        
        // Calculate and store risk factors
        try {
          console.log('🔍 Calculating and storing risk factors...');
          const riskFactors = await riskFactorsService.calculateAndStoreRiskFactors(saveResult.recordId, result);
          console.log('✅ Risk factors stored:', riskFactors.length, 'factors');
        } catch (error) {
          console.error('❌ Failed to store risk factors:', error);
        }

        // Screen and store sanctions data
        try {
          console.log('🔍 Screening and storing sanctions data...');
          const sanctionsResults = await riskFactorsService.screenSanctions(walletAddress, network);
          if (sanctionsResults.length > 0) {
            const storedSanctions = await riskFactorsService.storeSanctionsScreening(saveResult.recordId, sanctionsResults);
            console.log('✅ Sanctions screening stored:', storedSanctions.length, 'matches');
          } else {
            console.log('✅ No sanctions matches found');
          }
        } catch (error) {
          console.error('❌ Failed to store sanctions screening:', error);
        }

        // Add the record ID to the result and mark as temporary if save failed
        const enhancedResult = {
          ...result,
          recordId: saveResult.recordId,
          isTemporary: false
        };
        
        setAnalysisData(enhancedResult);
        toast.success('Wallet analysis completed successfully');
        
        return enhancedResult;
      } else {
        console.warn('⚠️ Failed to save to database, proceeding with temporary record');
        
        // Create temporary record ID for session
        const tempRecordId = `temp_${Date.now()}`;
        const tempResult = {
          ...result,
          recordId: tempRecordId,
          isTemporary: true
        };
        
        setAnalysisData(tempResult);
        toast.warning('Analysis completed but not saved to database');
        
        return tempResult;
      }
    } catch (error) {
      console.error('❌ Wallet analysis failed:', error);
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = (walletAddress: string) => {
    toast.info('Report generation initiated for ' + walletAddress);
  };

  return {
    isAnalyzing,
    analyzeWallet,
    generateReport,
    analysisData
  };
};
