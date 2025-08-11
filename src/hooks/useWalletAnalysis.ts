
import { useState } from 'react';
import { toast } from 'sonner';
import { enhancedWalletAPI } from '@/services/enhancedApi';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService } from '@/services/riskFactors';
import { WalletRiskResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useWalletAnalysis = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<WalletRiskResponse | null>(null);

  const analyzeWallet = async (walletAddress: string, network: string = 'bitcoin') => {
    if (!user) {
      toast.error('Please log in to perform wallet analysis');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      console.log('🚀 Starting wallet analysis for:', walletAddress);
      
      // Perform the wallet analysis
      const result = await enhancedWalletAPI.analyzeWallet(walletAddress);
      
      if (!result) {
        throw new Error('No analysis result received');
      }

      console.log('✅ Analysis completed:', result);

      // Save the analysis to database
      console.log('💾 Saving analysis to database...');
      const saveResult = await supabaseLookupRecords.createLookupRecord({
        wallet_address: result.address,
        network: result.network,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        processing_time_ms: result.processing_time_ms,
        risk_assessment: result,
        analyst_fields: {
          case_notes: '',
          analyst_decision: 'pending' as const,
          tags: [],
          attachments: []
        }
      }, user.id);
      
      if (saveResult.success && saveResult.record) {
        console.log('✅ Analysis saved with record ID:', saveResult.record.id);
        
        // Calculate and store risk factors
        try {
          console.log('🔍 Calculating and storing risk factors...');
          const riskFactors = await riskFactorsService.calculateAndStoreRiskFactors(saveResult.record.id, result);
          console.log('✅ Risk factors stored:', riskFactors.length, 'factors');
        } catch (error) {
          console.error('❌ Failed to store risk factors:', error);
        }

        // Screen and store sanctions data
        try {
          console.log('🔍 Screening and storing sanctions data...');
          const sanctionsResults = await riskFactorsService.screenSanctions(walletAddress, result.network);
          if (sanctionsResults.length > 0) {
            const storedSanctions = await riskFactorsService.storeSanctionsScreening(saveResult.record.id, sanctionsResults);
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
          recordId: saveResult.record.id,
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
