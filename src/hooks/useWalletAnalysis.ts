
import { useState } from 'react';
import { enhancedWalletAPI } from '@/services/enhancedApi';
import { storeAnalysisResult } from '@/services/walletAnalysisDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAuditAction } from '@/utils/auditLogger';

export const useWalletAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const analyzeWallet = async (address: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze wallets.",
        variant: "destructive",
      });
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      console.log(`🔍 Starting wallet analysis for: ${address}`);
      
      const result = await enhancedWalletAPI.analyzeWallet(address);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Analysis failed');
      }

      console.log('✅ Analysis completed successfully');
      
      // Store in database
      const dbResult = await storeAnalysisResult(
        address,
        result.data.network || 'ethereum',
        result.data,
        user.id
      );

      let recordId: string;
      let isTemporary = false;

      if (dbResult.success && dbResult.record) {
        recordId = dbResult.record.record_id;
        console.log(`✅ Analysis stored with record ID: ${recordId}`);
      } else {
        console.warn('⚠️ Failed to store in database, using temporary ID');
        recordId = `temp_${Date.now()}`;
        isTemporary = true;
      }

      // Log audit action
      await logAuditAction('wallet_lookup', recordId, {
        wallet_address: address,
        network: result.data.network || 'ethereum',
        risk_score: result.data.risk_score,
        risk_level: result.data.risk_level,
        transaction_count: result.data.transaction_count,
        processing_time_ms: result.data.processing_time_ms
      });

      const enhancedResult = {
        ...result.data,
        recordId,
        isTemporary
      };

      setAnalysisData(enhancedResult);
      
      toast({
        title: "Analysis Complete",
        description: `Wallet ${address.slice(0, 8)}... analyzed successfully.`,
      });

      return enhancedResult;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = async (walletAddress: string) => {
    // Log audit action for report generation
    await logAuditAction('generate_report', undefined, {
      wallet_address: walletAddress,
      report_type: 'comprehensive'
    });

    toast({
      title: "Report Generated",
      description: "Comprehensive wallet report has been prepared.",
    });
  };

  return {
    isAnalyzing,
    analyzeWallet,
    generateReport,
    analysisData
  };
};
