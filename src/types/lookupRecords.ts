
export interface LookupRecord {
  id: string;
  timestamp: string;
  wallet_address: string;
  network: 'BTC' | 'ETH';
  
  // Wallet Risk Assessment Summary
  risk_assessment: {
    risk_score: number;
    risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
    key_risk_factors: string[];
    recent_transactions: {
      direction: 'inbound' | 'outbound';
      amount: number;
      risk_score: number;
      timestamp: string;
    }[];
    flow_analysis: {
      total_inbound: number;
      total_outbound: number;
      net_flow: number;
    };
  };
  
  // AI-Generated Compliance Case Summary
  compliance_summary: {
    explanation: string;
    regulatory_relevance: string[];
    suggested_action: 'manual_review' | 'escalation' | 'block' | 'allow';
    confidence_level: number;
  };
  
  // Editable Fields for Analysts
  analyst_fields: {
    case_notes: string;
    analyst_decision: 'cleared' | 'escalated' | 'blocked' | 'no_action' | 'pending';
    tags: string[];
    attachments: {
      id: string;
      filename: string;
      type: string;
      uploaded_at: string;
    }[];
    analyst_name?: string;
    reviewed_at?: string;
  };
  
  // System metadata
  created_at: string;
  updated_at: string;
  processing_time_ms: number;
}

export interface LookupRecordFilters {
  risk_level?: ('Low' | 'Medium' | 'High' | 'Critical')[];
  analyst_decision?: ('cleared' | 'escalated' | 'blocked' | 'no_action' | 'pending')[];
  date_range?: {
    start: string;
    end: string;
  };
  tags?: string[];
  search_term?: string;
}
