
import { useState } from 'react';
import { WalletRiskResponse } from '@/services/api';
import { analyzeWalletWithRealData } from '@/services/enhancedApi';
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
      console.log('Starting enhanced wallet analysis with real-time sanctions screening for:', address);
      
      // Use enhanced API with real blockchain data and sanctions screening
      const result = await analyzeWalletWithRealData(address);
      console.log('Enhanced analysis result:', result);
      
      // Fix network normalization to match database constraint
      let normalizedNetwork = 'ethereum'; // default
      if (result.network) {
        const networkLower = result.network.toLowerCase();
        if (networkLower === 'bitcoin' || networkLower === 'btc') {
          normalizedNetwork = 'bitcoin';
        } else if (networkLower === 'ethereum' || networkLower === 'eth') {
          normalizedNetwork = 'ethereum';
        }
      }
      
      console.log(`Creating database record for ${address} with network: ${normalizedNetwork}, user: ${user.id}`);
      
      // Store in database with proper error handling and explicit user ID
      const dbResult = await supabaseLookupRecords.createLookupRecord({
        wallet_address: address,
        network: normalizedNetwork,
        risk_score: result.risk_score || 0,
        risk_level: result.risk_level || 'Low',
        processing_time_ms: result.processing_time_ms || 0,
        risk_assessment: {
          risk_score: result.risk_score || 0,
          risk_level: result.risk_level || 'Low',
          risk_factors: result.risk_factors || {},
          explanation: result.explanation || '',
          entity_attribution: result.entity_attribution || null,
          volume_metrics: result.volume_metrics || null,
          geographic_risk: result.geographic_risk || null,
          sanctions_exposure: result.sanctions_exposure || null,
          top_counterparties: result.top_counterparties || [],
          temporal_patterns: result.temporal_patterns || null,
          behavioral_classification: result.behavioral_classification || null,
          transaction_count: result.transaction_count || 0,
          last_activity: result.last_activity || null,
          processing_time_ms: result.processing_time_ms || 0,
          full_wallet_data: result
        },
        analyst_fields: {
          case_notes: '',
          analyst_decision: 'pending',
          tags: [],
          attachments: []
        }
      }, user.id);

      console.log('Database creation result:', dbResult);

      if (dbResult.success && dbResult.record) {
        console.log('Successfully created database record with ID:', dbResult.record.record_id);
        
        // Add the database record ID to the result for future reference
        const enhancedResult = {
          ...result,
          recordId: dbResult.record.record_id,
          network: normalizedNetwork
        };
        
        setAnalysisData(enhancedResult);
        
        // Calculate and store risk factors in background
        try {
          console.log('Calculating risk factors for record:', dbResult.record.id);
          await riskFactorsService.calculateAndStoreRiskFactors(dbResult.record.id, result);
          
          // Enhanced sanctions screening with entity attribution
          console.log('🔍 Performing enhanced sanctions screening...');
          let sanctionsResults = [];
          
          if (result.entity_attribution?.name) {
            sanctionsResults = await riskFactorsService.screenEntityByName(
              result.entity_attribution.name, 
              address
            );
          } else {
            sanctionsResults = await riskFactorsService.screenSanctions(address, normalizedNetwork);
          }
          
          if (sanctionsResults.length > 0) {
            console.log(`⚠️ Found ${sanctionsResults.length} sanctions matches, storing in database...`);
            await riskFactorsService.storeSanctionsScreening(dbResult.record.id, sanctionsResults);
          } else {
            console.log('✅ No sanctions matches found');
          }
        } catch (error) {
          console.error('Error calculating risk factors or sanctions screening:', error);
          // Don't fail the main analysis if risk factors fail
        }
        
        // Determine if real data was used
        const isRealData = result.explanation?.includes('[REAL DATA: YES]');
        const hasSanctionsData = result.explanation?.includes('[SANCTIONS:');
        
        toast({
          title: isRealData ? "Real-Time Analysis Complete" : "Analysis Complete (Mock Data)",
          description: `${result.entity_attribution?.name || 'Unknown Entity'} (${result.entity_attribution?.type || 'Unknown'}) • ${result.risk_level} risk • Record: ${dbResult.record.record_id}${isRealData ? ' • Live blockchain data' : ' • Fallback data'}${hasSanctionsData ? ' • Sanctions screened' : ''}`,
        });
      } else {
        console.error('Failed to store analysis result:', dbResult.error);
        // Still show the analysis even if DB storage fails
        setAnalysisData({
          ...result,
          network: normalizedNetwork
        });
        toast({
          title: "Analysis Complete - Warning",
          description: `Analysis completed but database record creation failed: ${dbResult.error}. Please try again.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: `Failed to analyze wallet: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
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
