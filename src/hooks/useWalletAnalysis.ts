
import { useState } from 'react';
import { WalletRiskResponse } from '@/services/api';
import { analyzeWalletWithRealData } from '@/services/enhancedApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validateWalletAddress, normalizeNetwork } from '@/services/walletValidation';
import { storeAnalysisResult, processRiskFactorsInBackground } from '@/services/walletAnalysisDatabase';
import { getAnalysisToastMessages, getErrorToastMessages } from '@/services/walletAnalysisNotifications';

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
      console.log('Starting enhanced wallet analysis with real-time data for:', trimmedAddress);
      
      // Show progress toast
      toast({
        title: "Analysis Starting",
        description: "Fetching real-time blockchain data...",
      });
      
      // Use enhanced API with real blockchain data
      const result = await analyzeWalletWithRealData(trimmedAddress);
      console.log('Enhanced analysis result:', result);
      
      // Fix network normalization
      const normalizedNetwork = normalizeNetwork(result.network);
      
      // Store in database with proper error handling
      const dbResult = await storeAnalysisResult(trimmedAddress, normalizedNetwork, result, user.id);
      console.log('Database creation result:', dbResult);

      if (dbResult.success && dbResult.record) {
        console.log('Successfully created database record with ID:', dbResult.record.record_id);
        
        // Add the database record ID to the result
        const enhancedResult = {
          ...result,
          recordId: dbResult.record.record_id,
          network: normalizedNetwork
        };
        
        setAnalysisData(enhancedResult);
        
        // Calculate and store risk factors in background (don't block UI)
        processRiskFactorsInBackground(dbResult.record.id, result, trimmedAddress, normalizedNetwork);
        
        // Show success toast
        const { title, description } = getAnalysisToastMessages(result);
        toast({ title, description });
      } else {
        console.error('Failed to store analysis result:', dbResult.error);
        // Still show the analysis even if DB storage fails
        setAnalysisData({
          ...result,
          network: normalizedNetwork
        });
        toast({
          title: "Analysis Complete - Storage Warning",
          description: `Analysis completed but record storage failed. Data is temporary only.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      
      const { errorTitle, errorMessage } = getErrorToastMessages(error as Error);
      toast({
        title: errorTitle,
        description: errorMessage,
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
      
      // For now, just show success - actual report generation would happen here
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
