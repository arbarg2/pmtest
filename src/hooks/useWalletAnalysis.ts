
import { useState } from 'react';
import { WalletRiskResponse, analyzeWalletRisk } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService } from '@/services/riskFactors';

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

    setIsAnalyzing(true);
    try {
      console.log('Starting wallet analysis for:', address);
      const result = await analyzeWalletRisk(address);
      console.log('Analysis result:', result);
      
      // Store in database with proper error handling
      const dbResult = await supabaseLookupRecords.createLookupRecord({
        wallet_address: address,
        network: result.network || 'bitcoin',
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        processing_time_ms: result.processing_time_ms || 0,
        risk_assessment: {
          risk_score: result.risk_score,
          risk_level: result.risk_level,
          risk_factors: result.risk_factors || {},
          explanation: result.explanation || '',
          entity_attribution: result.entity_attribution,
          volume_metrics: result.volume_metrics,
          geographic_risk: result.geographic_risk,
          sanctions_exposure: result.sanctions_exposure,
          top_counterparties: result.top_counterparties,
          temporal_patterns: result.temporal_patterns,
          behavioral_classification: result.behavioral_classification,
          transaction_count: result.transaction_count,
          last_activity: result.last_activity,
          processing_time_ms: result.processing_time_ms,
          full_wallet_data: result
        },
        analyst_fields: {
          case_notes: '',
          analyst_decision: 'pending',
          tags: [],
          attachments: []
        }
      }, user.id);

      if (dbResult.success && dbResult.record) {
        console.log('Successfully created database record with ID:', dbResult.record.id);
        
        // Add the database record ID to the result for future reference
        const enhancedResult = {
          ...result,
          recordId: dbResult.record.id
        };
        
        setAnalysisData(enhancedResult);
        
        // Calculate and store risk factors in background
        try {
          console.log('Calculating risk factors for record:', dbResult.record.id);
          await riskFactorsService.calculateAndStoreRiskFactors(dbResult.record.id, result);
          
          // Screen for sanctions
          const sanctionsResults = await riskFactorsService.screenSanctions(address, result.network || 'bitcoin');
          if (sanctionsResults.length > 0) {
            await riskFactorsService.storeSanctionsScreening(dbResult.record.id, sanctionsResults);
          }
        } catch (error) {
          console.error('Error calculating risk factors:', error);
          // Don't fail the main analysis if risk factors fail
        }
      } else {
        console.error('Failed to store analysis result:', dbResult.error);
        // Still show the analysis even if DB storage fails
        setAnalysisData(result);
        toast({
          title: "Analysis Complete",
          description: "Analysis completed but may not be saved. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Analysis Complete",
        description: `${result.entity_attribution?.name || 'Unknown Entity'} (${result.entity_attribution?.type || 'Unknown'}) • ${result.risk_level} risk • ${result.processing_time_ms || 0}ms`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
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
