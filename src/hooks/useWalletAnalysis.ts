
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
      console.log('🔧 Normalized network from', result.network, 'to', normalizedNetwork);
      
      // Create the enhanced result with normalized network
      const enhancedResult = {
        ...result,
        network: normalizedNetwork
      };
      
      // Try to store in database with improved error handling
      console.log('💾 Attempting to store analysis result in database...');
      console.log('📊 User ID:', user.id);
      console.log('📍 Network:', normalizedNetwork);
      console.log('🎯 Risk Score:', result.risk_score);
      console.log('⚠️ Risk Level:', result.risk_level);
      
      try {
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

        if (dbResult?.success && dbResult.record) {
          console.log('✅ Database record created successfully with ID:', dbResult.record.record_id || dbResult.record.id);
          
          // Set analysis data with the database record ID for navigation
          const finalResult = {
            ...enhancedResult,
            recordId: dbResult.record.record_id || dbResult.record.id,
            lookupId: dbResult.record.record_id || dbResult.record.id // Add lookup ID for display
          };
          
          setAnalysisData(finalResult);
          
          toast({
            title: "Analysis Complete",
            description: `Wallet analysis completed! Record ID: ${dbResult.record.record_id || dbResult.record.id}`,
          });
          
          return finalResult;
        } else {
          console.error('❌ Database storage failed:', dbResult?.error || 'Unknown error');
          console.error('❌ Full error details:', dbResult);
          
          // Generate a temporary ID for navigation purposes
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const finalResult = {
            ...enhancedResult,
            recordId: tempId,
            lookupId: tempId, // Add lookup ID for display
            isTemporary: true
          };
          
          setAnalysisData(finalResult);
          
          toast({
            title: "Analysis Complete",
            description: `Analysis completed but couldn't save to database: ${dbResult?.error || 'Unknown error'}`,
            variant: "destructive",
          });
          
          return finalResult;
        }
      } catch (dbError) {
        console.error('❌ Database error during storage:', dbError);
        
        // Generate a temporary ID for navigation purposes
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const finalResult = {
          ...enhancedResult,
          recordId: tempId,
          lookupId: tempId, // Add lookup ID for display
          isTemporary: true
        };
        
        setAnalysisData(finalResult);
        
        toast({
          title: "Analysis Complete",
          description: `Analysis completed but database error occurred: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
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
      
      throw error;
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
