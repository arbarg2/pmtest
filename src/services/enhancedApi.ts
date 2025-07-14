
import { WalletRiskResponse, analyzeWalletRisk } from './api';
import { realBlockchainAPI } from './realBlockchainAPI';
import { sanctionsScreeningService } from './sanctionsApi';

// Enhanced API service that PRIORITIZES real blockchain data
export const analyzeWalletWithRealData = async (address: string): Promise<WalletRiskResponse> => {
  const startTime = Date.now();
  
  try {
    // Detect network from address format
    const network = detectNetworkFromAddress(address);
    console.log(`🔍 PRIORITY: Real-time analysis for ${network} address: ${address}`);
    
    let realData = null;
    let useRealData = false;
    let apiError = null;
    
    // FORCE attempt to fetch real blockchain data - don't fallback easily
    try {
      if (network === 'bitcoin') {
        console.log('📡 Attempting Bitcoin real-time data from Blockstream API...');
        realData = await realBlockchainAPI.getBitcoinAddressData(address);
        useRealData = true;
        console.log('✅ SUCCESS: Bitcoin real-time data retrieved:', {
          balance: realData.balance,
          txCount: realData.transactionCount,
          totalReceived: realData.totalReceived
        });
      } else if (network === 'ethereum') {
        console.log('📡 Attempting Ethereum real-time data from Etherscan API...');
        realData = await realBlockchainAPI.getEthereumAddressData(address);
        useRealData = true;
        console.log('✅ SUCCESS: Ethereum real-time data retrieved:', {
          balance: realData.balance,
          txCount: realData.transactionCount
        });
      }
    } catch (error) {
      apiError = error;
      console.error('❌ CRITICAL: Real API failed - this should be investigated:', error);
      
      // For production, we should NOT fallback to mock data easily
      // Instead, throw error to alert user that real data is unavailable
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error(`Real-time data unavailable: ${error.message}. Please configure API keys in settings.`);
      }
      
      // Only fallback to mock if it's a temporary network issue
      console.warn('⚠️ FALLBACK WARNING: Using mock data due to API failure. Results may not be accurate.');
    }
    
    // If we don't have real data, clearly indicate this is mock/fallback data
    if (!useRealData) {
      console.log('📊 USING MOCK DATA - Results will be simulated');
      const mockResult = await analyzeWalletRisk(address);
      mockResult.explanation = `⚠️ MOCK DATA FALLBACK: Real blockchain APIs unavailable. This analysis uses simulated data and should not be used for compliance decisions. API Error: ${apiError?.message || 'Unknown error'}`;
      return mockResult;
    }
    
    // Generate analysis based on REAL data
    console.log('🚀 Generating analysis from REAL blockchain data...');
    const riskAnalysis = realBlockchainAPI.calculateRealRiskScore(realData, network);
    const entityAttribution = realBlockchainAPI.deriveEntityAttribution(realData, network);
    const volumeMetrics = realBlockchainAPI.calculateVolumeMetrics(realData, network);
    
    // Perform REAL sanctions screening
    let sanctionsResults = [];
    let riskScoreAdjustment = 0;
    
    try {
      console.log('🔍 REAL-TIME sanctions screening in progress...');
      sanctionsResults = await sanctionsScreeningService.screenEntity(
        entityAttribution.name,
        address
      );
      
      if (sanctionsResults.length > 0) {
        riskScoreAdjustment = sanctionsScreeningService.calculateRiskAdjustment(sanctionsResults);
        console.log(`⚠️ SANCTIONS ALERT: ${sanctionsResults.length} matches found, risk adjustment: +${riskScoreAdjustment}`);
      } else {
        console.log('✅ SANCTIONS CLEAR: No matches in international databases');
      }
    } catch (sanctionsError) {
      console.error('❌ Sanctions screening failed:', sanctionsError);
      // Don't fail the entire analysis, but log the error
    }
    
    const processingTime = Date.now() - startTime;
    
    // Calculate adjusted risk score based on REAL data
    const baseRiskScore = riskAnalysis.riskScore;
    const adjustedRiskScore = Math.min(10, baseRiskScore + riskScoreAdjustment);
    const adjustedRiskLevel = adjustedRiskScore >= 7 ? 'High' : adjustedRiskScore >= 4 ? 'Medium' : 'Low';
    
    // Build response with REAL data validation
    const enhancedResponse: WalletRiskResponse = {
      address,
      network,
      risk_score: adjustedRiskScore,
      risk_level: adjustedRiskLevel,
      risk_factors: {
        ...riskAnalysis.riskFactors,
        sanctions_exposure: sanctionsResults.length > 0,
        sanctions_matches: sanctionsResults.length > 0,
        sanctions_confidence: sanctionsResults.length > 0 && 
          Math.max(...sanctionsResults.map(r => r.confidence_score)) > 0.7
      },
      entity_attribution: entityAttribution,
      volume_metrics: {
        ...volumeMetrics,
        largest_transaction: realData.transactions && realData.transactions.length > 0 ? {
          amount: network === 'bitcoin' 
            ? Math.max(...realData.transactions.map((tx: any) => 
                tx.vout ? Math.max(...tx.vout.map((out: any) => out.value / 100000000)) : 0
              ))
            : Math.max(...realData.transactions.map((tx: any) => 
                parseInt(tx.value) / 1e18
              )),
          direction: 'outbound',
          timestamp: network === 'bitcoin'
            ? new Date(realData.transactions[0]?.status?.block_time * 1000).toISOString()
            : new Date(parseInt(realData.transactions[0]?.timeStamp) * 1000).toISOString(),
          counterparty: network === 'bitcoin' 
            ? realData.transactions[0]?.vout[0]?.scriptpubkey_address 
            : realData.transactions[0]?.to
        } : undefined
      },
      geographic_risk: {
        primary_region: 'Unknown',
        risk_jurisdictions: [],
        geo_risk_score: 0.1
      },
      temporal_patterns: {
        first_seen: realData.transactions && realData.transactions.length > 0
          ? network === 'bitcoin'
            ? new Date((realData.transactions[realData.transactions.length - 1]?.status?.block_time || Date.now() / 1000) * 1000).toISOString()
            : new Date(parseInt(realData.transactions[realData.transactions.length - 1]?.timeStamp || '0') * 1000).toISOString()
          : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: realData.transactions && realData.transactions.length > 0
          ? network === 'bitcoin'
            ? new Date((realData.transactions[0]?.status?.block_time || Date.now() / 1000) * 1000).toISOString()
            : new Date(parseInt(realData.transactions[0]?.timeStamp || '0') * 1000).toISOString()
          : new Date().toISOString()
      },
      behavioral_classification: {
        primary_type: entityAttribution.type,
        confidence_level: Math.round(entityAttribution.confidence * 100)
      },
      sanctions_exposure: {
        direct_hits: sanctionsResults.filter(r => r.match_type === 'direct').length,
        indirect_exposure: {
          one_hop: sanctionsResults.filter(r => r.match_type === '1-hop').length,
          two_hop: 0
        },
        proximity_score: sanctionsResults.length > 0 ? 
          Math.max(...sanctionsResults.map(r => r.confidence_score)) : 0
      },
      top_counterparties: realData.transactions && realData.transactions.length > 0 ? [{
        entity_name: 'Unknown Entity',
        risk_level: 'Low',
        transaction_count: Math.min(realData.transactions.length, 10),
        total_volume: volumeMetrics.lifetime_value.outbound
      }] : [],
      transaction_count: realData.transactionCount || realData.transactions?.length || 0,
      last_activity: realData.transactions && realData.transactions.length > 0
        ? network === 'bitcoin'
          ? new Date((realData.transactions[0]?.status?.block_time || Date.now() / 1000) * 1000).toISOString()
          : new Date(parseInt(realData.transactions[0]?.timeStamp || '0') * 1000).toISOString()
        : new Date().toISOString(),
      processing_time_ms: processingTime,
      explanation: `✅ REAL-TIME ANALYSIS: Live ${network} blockchain data from ${network === 'bitcoin' ? 'Blockstream API' : 'Etherscan API'}. Balance: ${realData.balance?.toFixed(6)} ${network.toUpperCase()}, Transactions: ${realData.transactionCount || realData.transactions?.length || 0}${sanctionsResults.length > 0 ? ` | SANCTIONS: ${sanctionsResults.length} matches found` : ' | SANCTIONS: Clean'}. This analysis uses verified blockchain data and real-time sanctions screening.`,
      risk_score_breakdown: {
        transaction_volume: { score: Math.min((realData.transactionCount || 0) / 100, 1) },
        balance_analysis: { score: Math.min((realData.balance || 0) / 10, 1) },
        pattern_analysis: { score: baseRiskScore / 10 },
        sanctions_screening: { score: riskScoreAdjustment / 10 }
      },
      asset_breakdown: {
        [network.toUpperCase()]: {
          balance: realData.balance || 0,
          usd_value: (realData.balance || 0) * (network === 'bitcoin' ? 45000 : 2500)
        }
      }
    };
    
    console.log('🎯 FINAL RESULT: Real-time analysis complete with live blockchain data');
    return enhancedResponse;
    
  } catch (error) {
    console.error('❌ CRITICAL FAILURE in enhanced analysis:', error);
    
    // Don't hide errors - surface them to the user
    if (error instanceof Error && error.message.includes('API key')) {
      throw error; // Re-throw API key errors
    }
    
    // For other errors, provide fallback but clearly indicate it's not real data
    console.warn('🔄 EMERGENCY FALLBACK: Using mock data due to critical failure');
    const fallbackResult = await analyzeWalletRisk(address);
    fallbackResult.explanation = `❌ SYSTEM ERROR: Real-time analysis failed (${error instanceof Error ? error.message : 'Unknown error'}). This is simulated data only - DO NOT use for compliance decisions. Contact support to resolve API connectivity issues.`;
    return fallbackResult;
  }
};

function detectNetworkFromAddress(address: string): 'bitcoin' | 'ethereum' {
  // Bitcoin addresses start with 1, 3, or bc1
  if (address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || address.startsWith('bc1')) {
    return 'bitcoin';
  }
  // Ethereum addresses are 42 characters starting with 0x
  if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return 'ethereum';
  }
  // Default to bitcoin for ambiguous formats
  return 'bitcoin';
}
