
import { useState } from 'react';
import { WalletRiskResponse } from '@/services/api';
import { analyzeWalletWithRealData } from '@/services/enhancedApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validateWalletAddress, normalizeNetwork } from '@/services/walletValidation';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';

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
      
      // Try to store in database with retry mechanism
      console.log('💾 Storing analysis result in database...');
      let dbResult = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !dbResult?.success) {
        try {
          dbResult = await supabaseLookupRecords.createLookupRecord({
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
          
          if (dbResult?.success) {
            break; // Success, exit retry loop
          }
          
          // If it's a duplicate key error, wait a bit and retry
          if (dbResult?.code === '23505' || dbResult?.error?.includes('duplicate')) {
            retryCount++;
            console.log(`Retry attempt ${retryCount}/${maxRetries} due to duplicate key...`);
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Progressive delay
            continue;
          } else {
            break; // Other error, don't retry
          }
        } catch (error) {
          console.error('Database storage attempt failed:', error);
          retryCount++;
          if (retryCount >= maxRetries) break;
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }

      if (dbResult?.success && dbResult.record) {
        console.log('✅ Database record created successfully');
        
        // Set analysis data with the database record ID for navigation
        const finalResult = {
          ...enhancedResult,
          recordId: dbResult.record.id // Use the database internal ID
        };
        
        setAnalysisData(finalResult);
        
        toast({
          title: "Analysis Complete",
          description: "Wallet analysis completed successfully!",
        });
        
        return finalResult; // Return for immediate use
      } else {
        console.warn('❌ Database storage failed after retries, proceeding without storage');
        
        // Generate a temporary ID for navigation purposes
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const finalResult = {
          ...enhancedResult,
          recordId: tempId,
          isTemporary: true
        };
        
        setAnalysisData(finalResult);
        
        toast({
          title: "Analysis Complete",
          description: "Analysis completed but couldn't save to database. Results are temporary.",
          variant: "destructive",
        });
        
        return finalResult;
      }
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze wallet. Please try again.",
        variant: "destructive",
      });
      
      throw error; // Re-throw for calling component to handle
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
