
export interface WalletRiskResponse {
  address: string;
  network: string;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  risk_factors: {
    sanctioned: {
      present: boolean;
      severity: string;
      description: string;
    };
    fraud_reports: {
      present: boolean;
      severity: string;
      description: string;
    };
    dark_market_exposure: {
      present: boolean;
      severity: string;
      description: string;
    };
    sanctions_exposure: {
      present: boolean;
      severity: string;
      description: string;
    };
    mixer_usage: boolean;
    high_frequency_trading: boolean;
  };
  explanation: string;
  entity_attribution: {
    name: string;
    type: string;
    risk_level: string;
    confidence: number;
  } | null;
  volume_metrics: {
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
      timestamp?: string;
    };
  } | null;
  geographic_risk: {
    primary_region: string;
    risk_jurisdictions: string[];
    geo_risk_score: number;
  } | null;
  sanctions_exposure: {
    direct_exposure: boolean;
    indirect_exposure: boolean;
    risk_score: number;
    matched_entities: {
      name: string;
      list: string;
      confidence: number;
    }[];
    direct_hits: number;
    proximity_score: number;
  } | null;
  top_counterparties: {
    address: string;
    entity_name: string;
    risk_level: string;
    risk_score: number;
    transaction_count: number;
    total_volume: number;
  }[];
  temporal_patterns: {
    activity_periods: {
      period: string;
      transaction_count: number;
      volume: number;
    }[];
    peak_activity: string;
    recent_activity: boolean;
    first_seen?: string;
    last_active?: string;
  } | null;
  behavioral_classification: {
    category: string;
    confidence: number;
    patterns: string[];
    primary_type?: string;
    confidence_level?: number;
  } | null;
  transaction_count: number;
  last_activity: string;
  processing_time_ms: number;
  recordId?: string;
  lookupId?: string;
  isTemporary?: boolean;
  is_case?: boolean;
  case_id?: string;
  case_status?: string;
  case_created_at?: string;
  risk_score_breakdown?: {
    [key: string]: {
      score: number;
      description?: string;
    };
  };
  asset_breakdown?: {
    [asset: string]: {
      balance: number;
      usd_value: number;
    };
  };
  ai_summary?: string;
}

// Mock implementation - to be replaced with real API calls
export const analyzeWalletRisk = async (address: string): Promise<WalletRiskResponse> => {
  // This is a mock implementation
  // In production, this would call the real blockchain analysis API
  
  return {
    address,
    network: address.startsWith('0x') ? 'ethereum' : 'bitcoin',
    risk_score: Math.random() * 10,
    risk_level: Math.random() > 0.5 ? 'Low' : 'Medium',
    risk_factors: {
      sanctioned: {
        present: false,
        severity: 'low',
        description: 'No sanctions exposure detected'
      },
      fraud_reports: {
        present: false,
        severity: 'low',
        description: 'No fraud reports found'
      },
      dark_market_exposure: {
        present: false,
        severity: 'low',
        description: 'No dark market connections'
      },
      sanctions_exposure: {
        present: false,
        severity: 'low',
        description: 'No sanctions exposure'
      },
      mixer_usage: false,
      high_frequency_trading: false
    },
    explanation: 'Mock analysis result',
    entity_attribution: null,
    volume_metrics: null,
    geographic_risk: null,
    sanctions_exposure: null,
    top_counterparties: [],
    temporal_patterns: null,
    behavioral_classification: null,
    transaction_count: 0,
    last_activity: new Date().toISOString(),
    processing_time_ms: 100,
    lookupId: `LR_${Date.now()}`
  };
};
