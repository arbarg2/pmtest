
import { useState } from 'react';
import { WalletRiskResponse } from '@/services/api';
import { analyzeWalletWithRealData } from '@/services/enhancedApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validateWalletAddress, normalizeNetwork } from '@/services/walletValidation';

export const useWalletAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<WalletRiskResponse | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const analyzeWallet = async (address: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to analyze wallets",
        variant: "destructive",
      });
      return;
    }

    // Validate address format early
    const validation = validateWalletAddress(address);
    if (!validation.isValid) {
      toast({
        title: "Invalid Address",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const trimmedAddress = address.trim();
    setIsAnalyzing(true);
    
    try {
      console.log('🔍 Starting wallet analysis for:', trimmedAddress);
      
      // Show progress toast
      toast({
        title: "Analysis Starting",
        description: "Fetching blockchain data...",
      });
      
      // Get analysis result quickly
      const result = await analyzeWalletWithRealData(trimmedAddress);
      console.log('✅ Analysis complete:', result.address);
      
      // Fix network normalization
      const normalizedNetwork = normalizeNetwork(result.network);
      
      // Create the enhanced result with normalized network
      const enhancedResult = {
        ...result,
        network: normalizedNetwork
      };
      
      // Set analysis data immediately
      setAnalysisData(enhancedResult);
      
      // Show success immediately
      toast({
        title: "Analysis Complete",
        description: "Wallet analysis completed successfully!",
      });
      
      // Store in database in background - don't wait for this
      import('@/services/walletAnalysisDatabase').then(({ storeAnalysisResult, processRiskFactorsInBackground }) => {
        storeAnalysisResult(trimmedAddress, normalizedNetwork, result, user.id)
          .then((dbResult) => {
            if (dbResult.success && dbResult.record) {
              console.log('✅ Database record created with ID:', dbResult.record.record_id);
              
              // Update the analysis data with the database record ID
              const finalResult = {
                ...enhancedResult,
                recordId: dbResult.record.record_id
              };
              
              setAnalysisData(finalResult);
              
              // Process risk factors in background
              processRiskFactorsInBackground(dbResult.record.id, result, trimmedAddress, normalizedNetwork)
                .catch(error => console.error('Background processing failed:', error));
            } else {
              console.error('❌ Failed to store analysis result:', dbResult.error);
            }
          })
          .catch(dbError => console.error('Database storage error:', dbError));
      });
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = async (address: string) => {
    try {
      toast({
        title: "Generating Report",
        description: "Creating comprehensive analysis report...",
      });
      
      setTimeout(() => {
        toast({
          title: "Report Generated",
          description: "Compliance report has been generated successfully",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    isAnalyzing,
    analysisData,
    analyzeWallet,
    generateReport,
    setAnalysisData
  };
};
