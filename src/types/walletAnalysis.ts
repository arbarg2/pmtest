
export interface EntityAttribution {
  name?: string;
  type: 'Exchange' | 'Mixer' | 'Scam' | 'Private Wallet' | 'DeFi Protocol' | 'Unknown';
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
}

export interface VolumeMetrics {
  lifetime_value: {
    inbound: number;
    outbound: number;
    net: number;
    usd_equivalent: number;
  };
  largest_transaction: {
    amount: number;
    counterparty?: string;
    timestamp: string;
    direction: 'inbound' | 'outbound';
  };
  average_transaction_size: number;
  volume_trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

export interface GeographicRisk {
  primary_region?: string;
  risk_jurisdictions: string[];
  geo_risk_score: number;
  exchange_exposure: {
    region: string;
    percentage: number;
  }[];
}

export interface TemporalPattern {
  first_seen: string;
  last_active: string;
  transaction_frequency: {
    timestamps: string[];
    counts: number[];
  };
  activity_bursts: {
    timestamp: string;
    volume: number;
    transaction_count: number;
  }[];
}

export interface BehavioralClassification {
  primary_type: 'Exchange Account' | 'Gambling' | 'Mixer' | 'Ransomware' | 'NFT/DeFi Trader' | 'Unknown';
  confidence_level: number;
  supporting_indicators: string[];
}

export interface SanctionsExposure {
  direct_hits: number;
  indirect_exposure: {
    one_hop: number;
    two_hop: number;
    three_hop: number;
  };
  proximity_score: number;
  flagged_entities: string[];
}

export interface RiskScoreBreakdown {
  sanctions_exposure: { weight: number; score: number };
  mixer_usage: { weight: number; score: number };
  volume_patterns: { weight: number; score: number };
  entity_associations: { weight: number; score: number };
  temporal_patterns: { weight: number; score: number };
  geographic_risk: { weight: number; score: number };
}

export interface CounterpartyConnection {
  address: string;
  entity_name?: string;
  transaction_count: number;
  total_volume: number;
  risk_level: 'Low' | 'Medium' | 'High';
  relationship_type: 'frequent' | 'high_value' | 'recent' | 'suspicious';
}
