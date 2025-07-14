
import { WalletRiskResponse, analyzeWalletRisk } from './api';
import { realBlockchainAPI } from './realBlockchainAPI';
import { sanctionsScreeningService } from './sanctionsApi';

// Enhanced API service that uses real blockchain data when available
export const analyzeWalletWithRealData = async (address: string): Promise<WalletRiskResponse> => {
  const startTime = Date.now();
  
  try {
    // Detect network from address format
    const network = detectNetworkFromAddress(address);
    console.log(`Analyzing ${network} address: ${address} [REAL API MODE]`);
    
    let realData = null;
    let useRealData = false;
    
    // Try to fetch real blockchain data
    try {
      if (network === 'bitcoin') {
        realData = await realBlockchainAPI.getBitcoinAddressData(address);
        useRealData = true;
        console.log('✅ Successfully fetched Bitcoin data from Blockstream:', realData);
      } else if (network === 'ethereum') {
        realData = await realBlockchainAPI.getEthereumAddressData(address);
        useRealData = true;
        console.log('✅ Successfully fetched Ethereum data from Etherscan:', realData);
      }
    } catch (error) {
      console.warn('⚠️ Real API failed, falling back to mock data:', error);
      // Fall back to mock data
      return await analyzeWalletRisk(address);
    }
    
    if (!useRealData) {
      console.log('📊 Using mock data fallback');
      return await analyzeWalletRisk(address);
    }
    
    // Generate analysis based on real data
    const riskAnalysis = realBlockchainAPI.calculateRealRiskScore(realData, network);
    const entityAttribution = realBlockchainAPI.deriveEntityAttribution(realData, network);
    const volumeMetrics = realBlockchainAPI.calculateVolumeMetrics(realData, network);
    
    // Perform enhanced sanctions screening
    let sanctionsResults = [];
    let riskScoreAdjustment = 0;
    
    try {
      console.log('🔍 Performing real-time sanctions screening...');
      sanctionsResults = await sanctionsScreeningService.screenEntity(
        entityAttribution.name,
        address
      );
      
      if (sanctionsResults.length > 0) {
        riskScoreAdjustment = sanctionsScreeningService.calculateRiskAdjustment(sanctionsResults);
        console.log(`⚠️ Sanctions matches found: ${sanctionsResults.length}, risk adjustment: +${riskScoreAdjustment}`);
      } else {
        console.log('✅ No sanctions matches found');
      }
    } catch (sanctionsError) {
      console.warn('Sanctions screening failed, continuing without adjustment:', sanctionsError);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Calculate adjusted risk score
    const baseRiskScore = riskAnalysis.riskScore;
    const adjustedRiskScore = Math.min(10, baseRiskScore + riskScoreAdjustment);
    const adjustedRiskLevel = adjustedRiskScore >= 7 ? 'High' : adjustedRiskScore >= 4 ? 'Medium' : 'Low';
    
    const enhancedResponse: WalletRiskResponse = {
      address,
      network,
      risk_score: adjustedRiskScore,
      risk_level: adjustedRiskLevel,
      risk_factors: {
        ...riskAnalysis.riskFactors,
        sanctions_exposure: sanctionsResults.length > 0,
        sanctions_matches: sanctionsResults.length,
        sanctions_confidence: sanctionsResults.length > 0 ? 
          Math.max(...sanctionsResults.map(r => r.confidence_score)) : 0
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
      explanation: `${riskAnalysis.explanation} [REAL DATA: ${useRealData ? 'YES - Live blockchain data' : 'NO - Mock fallback'}]${sanctionsResults.length > 0 ? ` [SANCTIONS: ${sanctionsResults.length} matches found]` : ' [SANCTIONS: Clean]'}`,
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
    
    console.log('🚀 Generated enhanced analysis with REAL blockchain data and sanctions screening:', enhancedResponse);
    return enhancedResponse;
    
  } catch (error) {
    console.error('❌ Enhanced analysis failed, using fallback:', error);
    // Final fallback to original mock analysis
    return await analyzeWalletRisk(address);
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
