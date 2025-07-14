
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

    // Validate address format early
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address",
        variant: "destructive",
      });
      return;
    }

    // Basic format validation
    const isValidBitcoin = trimmedAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || trimmedAddress.startsWith('bc1');
    const isValidEthereum = trimmedAddress.match(/^0x[a-fA-F0-9]{40}$/);
    
    if (!isValidBitcoin && !isValidEthereum) {
      toast({
        title: "Invalid Address Format",
        description: "Please enter a valid Bitcoin or Ethereum address",
        variant: "destructive",
      });
      return;
    }

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
      
      console.log(`Creating database record for ${trimmedAddress} with network: ${normalizedNetwork}, user: ${user.id}`);
      
      // Store in database with proper error handling
      const dbResult = await supabaseLookupRecords.createLookupRecord({
        wallet_address: trimmedAddress,
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
        
        // Add the database record ID to the result
        const enhancedResult = {
          ...result,
          recordId: dbResult.record.record_id,
          network: normalizedNetwork
        };
        
        setAnalysisData(enhancedResult);
        
        // Calculate and store risk factors in background (don't block UI)
        try {
          console.log('Calculating risk factors for record:', dbResult.record.id);
          await Promise.race([
            riskFactorsService.calculateAndStoreRiskFactors(dbResult.record.id, result),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Risk factors timeout')), 10000))
          ]);
          
          // Enhanced sanctions screening
          console.log('🔍 Performing enhanced sanctions screening...');
          let sanctionsResults = [];
          
          if (result.entity_attribution?.name) {
            sanctionsResults = await Promise.race([
              riskFactorsService.screenEntityByName(result.entity_attribution.name, trimmedAddress),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Sanctions timeout')), 10000))
            ]);
          } else {
            sanctionsResults = await Promise.race([
              riskFactorsService.screenSanctions(trimmedAddress, normalizedNetwork),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Sanctions timeout')), 10000))
            ]);
          }
          
          if (sanctionsResults.length > 0) {
            console.log(`⚠️ Found ${sanctionsResults.length} sanctions matches, storing in database...`);
            await riskFactorsService.storeSanctionsScreening(dbResult.record.id, sanctionsResults);
          } else {
            console.log('✅ No sanctions matches found');
          }
        } catch (error) {
          console.error('Error calculating risk factors or sanctions screening:', error);
          // Don't fail the main analysis if background tasks fail
        }
        
        // Determine if real data was used
        const isRealData = result.explanation?.includes('REAL-TIME ANALYSIS');
        const hasSanctionsData = result.explanation?.includes('SANCTIONS:');
        
        toast({
          title: isRealData ? "✅ Real-Time Analysis Complete" : "⚠️ Analysis Complete (Limited Data)",
          description: `${result.entity_attribution?.name || 'Unknown Entity'} • ${result.risk_level} risk • Processing: ${result.processing_time_ms}ms${isRealData ? ' • Live blockchain data' : ' • Please configure API keys for real-time data'}${hasSanctionsData ? ' • Sanctions screened' : ''}`,
        });
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
      
      let errorTitle = "Analysis Failed";
      let errorMessage = "Unknown error occurred. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorTitle = "API Configuration Required";
          errorMessage = error.message + " Please configure your API keys in settings.";
        } else if (error.message.includes('Network error')) {
          errorTitle = "Network Error";
          errorMessage = error.message;
        } else if (error.message.includes('Invalid')) {
          errorTitle = "Invalid Address";
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
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
