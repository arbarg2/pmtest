
export interface WalletRiskResponse {
  address: string;
  network: string;
  risk_score: number;
  risk_level: string;
  explanation: string;
  entity_attribution?: {
    name: string;
    type: string;
    confidence: number;
    risk_level: string;
  };
  volume_metrics?: {
    lifetime_value?: {
      inbound: number;
      outbound: number;
      net: number;
      usd_equivalent: number;
    };
    average_transaction_size?: number;
    largest_transaction?: {
      amount: number;
      direction: string;
      timestamp?: string;
    };
  };
  geographic_risk?: {
    primary_region: string;
    geo_risk_score: number;
    risk_jurisdictions?: string[];
  };
  sanctions_exposure?: {
    direct_exposure: boolean;
    indirect_exposure: boolean;
    risk_score: number;
    matched_entities: Array<{
      name: string;
      list: string;
      confidence: number;
    }>;
    direct_hits?: number;
    proximity_score?: number;
  };
  top_counterparties?: Array<{
    entity_name: string;
    risk_level: string;
    transaction_count: number;
    total_volume: number;
  }>;
  temporal_patterns?: {
    activity_periods: Array<{
      period: string;
      transaction_count: number;
      volume: number;
    }>;
    peak_activity: string;
    recent_activity: boolean;
    first_seen?: string;
    last_active?: string;
  };
  behavioral_classification?: {
    category: string;
    confidence: number;
    patterns: string[];
    primary_type?: string;
    confidence_level?: number;
  };
  risk_factors?: {
    [key: string]: {
      present: boolean;
      severity: string;
      description: string;
    };
  };
  transaction_count?: number;
  last_activity?: string;
  processing_time_ms?: number;
  recordId?: string;
  isTemporary?: boolean;
  is_case?: boolean;
  case_id?: string;
  case_status?: string;
  case_created_at?: string;
  risk_score_breakdown?: {
    [key: string]: {
      score: number;
    };
  };
  asset_breakdown?: {
    [key: string]: {
      balance: number;
      usd_value: number;
    };
  };
}

// Export the analyzeWalletRisk function that other files are trying to import
export const analyzeWalletRisk = async (address: string): Promise<WalletRiskResponse> => {
  // This is a placeholder - the actual implementation should use enhancedApi
  throw new Error('Use analyzeWalletWithRealData from enhancedApi instead');
};
