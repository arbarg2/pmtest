
import { supabase } from '@/integrations/supabase/client';

export interface WalletRiskResponse {
  address: string;
  network: string;
  risk_score: number;
  risk_level: string;
  risk_factors: Record<string, boolean>;
  entity_attribution?: {
    name: string;
    type: string;
    risk_level: string;
    confidence: number;
  };
  volume_metrics?: {
    lifetime_value: {
      inbound: number;
      outbound: number;
      net: number;
      usd_equivalent: number;
    };
    average_transaction_size: number;
    largest_transaction?: {
      amount: number;
      direction: string;
      timestamp: string;
      counterparty?: string;
    };
  };
  geographic_risk?: {
    primary_region: string;
    risk_jurisdictions: string[];
    geo_risk_score: number;
  };
  temporal_patterns?: {
    first_seen: string;
    last_active: string;
  };
  behavioral_classification?: {
    primary_type: string;
    confidence_level?: number;
  };
  sanctions_exposure?: {
    direct_hits: number;
    indirect_exposure: {
      one_hop: number;
      two_hop: number;
    };
    proximity_score: number;
  };
  top_counterparties?: Array<{
    entity_name: string;
    risk_level: string;
    transaction_count: number;
    total_volume: number;
  }>;
  transaction_count: number;
  last_activity: string;
  processing_time_ms: number;
  explanation: string;
  risk_score_breakdown?: Record<string, any>;
  asset_breakdown?: Record<string, any>;
  recordId?: string;
}

// MOCK DATA FALLBACK - Used when real APIs are unavailable or in development mode
export const analyzeWalletRisk = async (address: string): Promise<WalletRiskResponse> => {
  const startTime = Date.now();
  
  console.log('📊 [MOCK DATA] Generating fallback analysis for:', address);
  
  // Generate more realistic risk factors based on address characteristics
  const addressHash = address.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const seed = Math.abs(addressHash) / 1000000;
  const riskSeed = (seed % 1);
  
  // Determine risk level based on address characteristics
  let riskLevel: string;
  let riskScore: number;
  
  if (riskSeed > 0.85) {
    riskLevel = 'High';
    riskScore = 7 + (riskSeed * 3);
  } else if (riskSeed > 0.4) {
    riskLevel = 'Medium'; 
    riskScore = 3 + (riskSeed * 4);
  } else {
    riskLevel = 'Low';
    riskScore = riskSeed * 3;
  }

  // Generate realistic entity attribution
  const entityTypes = ['exchange', 'private', 'defi', 'mixer', 'custodial'];
  const entityNames = {
    exchange: ['Binance', 'Coinbase', 'Kraken', 'Unknown Exchange'],
    private: ['Private Wallet', 'Personal Wallet', 'Individual User'],
    defi: ['Uniswap', 'Compound', 'DeFi Protocol'],
    mixer: ['Tornado Cash', 'Privacy Mixer', 'Anonymization Service'],
    custodial: ['Custody Service', 'Institutional Wallet', 'Corporate Treasury']
  };
  
  const entityType = entityTypes[Math.floor(riskSeed * entityTypes.length)];
  const entityName = entityNames[entityType][Math.floor((riskSeed * 10) % entityNames[entityType].length)];

  // Realistic processing time for mock (faster than real API)
  const processingTime = 150 + Math.floor(Math.random() * 100);
  
  const mockResponse: WalletRiskResponse = {
    address,
    network: address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3') ? 'bitcoin' : 'ethereum',
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_factors: {
      sanctioned: riskSeed > 0.95,
      fraud_reports: riskSeed > 0.9,
      dark_market_exposure: riskSeed > 0.85,
      mixer_usage: riskSeed > 0.8 || entityType === 'mixer',
      high_frequency_trading: riskSeed > 0.7
    },
    entity_attribution: {
      name: entityName,
      type: entityType,
      risk_level: riskLevel,
      confidence: 0.6 + (riskSeed * 0.4)
    },
    volume_metrics: {
      lifetime_value: {
        inbound: 100 + (riskSeed * 10000),
        outbound: 90 + (riskSeed * 9000),
        net: 10 + (riskSeed * 1000),
        usd_equivalent: 5000 + (riskSeed * 100000)
      },
      average_transaction_size: 1 + (riskSeed * 50)
    },
    geographic_risk: {
      primary_region: 'North America',
      risk_jurisdictions: riskSeed > 0.8 ? ['High-Risk Jurisdiction'] : [],
      geo_risk_score: riskSeed * 5
    },
    temporal_patterns: {
      first_seen: new Date(Date.now() - (riskSeed * 365 * 24 * 60 * 60 * 1000)).toISOString(),
      last_active: new Date(Date.now() - (riskSeed * 30 * 24 * 60 * 60 * 1000)).toISOString()
    },
    behavioral_classification: {
      primary_type: 'normal',
      confidence_level: Math.floor(60 + (riskSeed * 40))
    },
    sanctions_exposure: {
      direct_hits: riskSeed > 0.95 ? 1 : 0,
      indirect_exposure: {
        one_hop: Math.floor(riskSeed * 3),
        two_hop: Math.floor(riskSeed * 5)
      },
      proximity_score: riskSeed * 0.5
    },
    top_counterparties: [
      {
        entity_name: 'Binance',
        risk_level: 'Low',
        transaction_count: Math.floor(10 + (riskSeed * 50)),
        total_volume: 50 + (riskSeed * 200)
      }
    ],
    transaction_count: Math.floor(10 + (riskSeed * 1000)),
    last_activity: new Date(Date.now() - (riskSeed * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    processing_time_ms: processingTime,
    explanation: `[MOCK DATA - FALLBACK] Simulated analysis shows ${riskLevel.toLowerCase()} risk indicators for this ${entityType} wallet. This is fallback data - real blockchain APIs unavailable.`,
    risk_score_breakdown: {},
    asset_breakdown: {}
  };

  // Simulate realistic API delay
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  console.log('📊 [MOCK DATA] Generated fallback response:', mockResponse);
  return mockResponse;
};
