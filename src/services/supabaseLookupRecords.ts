
import { supabase } from '@/integrations/supabase/client';
import { LookupRecord } from '@/types/lookupRecords';
import { WalletRiskResponse } from './api';

class SupabaseLookupRecordService {
  // Generate AI compliance summary
  private generateComplianceSummary(walletData: WalletRiskResponse): LookupRecord['compliance_summary'] {
    const riskFactors = Object.entries(walletData.risk_factors)
      .filter(([_, value]) => value)
      .map(([key, _]) => key.replace(/_/g, ' '));

    let explanation = '';
    let regulatoryRelevance: string[] = [];
    let suggestedAction: LookupRecord['compliance_summary']['suggested_action'] = 'allow';

    switch (walletData.risk_level) {
      case 'Low':
        explanation = `This wallet demonstrates normal transaction patterns with minimal risk indicators. The address appears to engage primarily with reputable counterparties and shows no significant red flags that would raise compliance concerns.`;
        suggestedAction = 'allow';
        break;
      case 'Medium':
        explanation = `This wallet shows moderate risk indicators that warrant additional scrutiny. While not immediately concerning, the transaction patterns or counterparty associations suggest enhanced due diligence may be appropriate.`;
        regulatoryRelevance = ['Enhanced Due Diligence Required'];
        suggestedAction = 'manual_review';
        break;
      case 'High':
        explanation = `This wallet exhibits significant risk indicators including potential connections to high-risk entities or suspicious activity patterns. Immediate review and potential blocking recommended pending further investigation.`;
        regulatoryRelevance = ['AML Compliance Review', 'Suspicious Activity'];
        suggestedAction = 'escalation';
        break;
    }

    if (walletData.risk_factors.sanctioned) {
      regulatoryRelevance.push('OFAC Sanctions Screening');
      suggestedAction = 'block';
      explanation += ' WARNING: Potential sanctions exposure detected.';
    }

    if (walletData.risk_factors.fraud_reports) {
      regulatoryRelevance.push('Fraud Prevention');
    }

    if (walletData.risk_factors.mixer_usage) {
      regulatoryRelevance.push('Privacy Coin/Mixer Activity');
    }

    return {
      explanation,
      regulatory_relevance: regulatoryRelevance,
      suggested_action: suggestedAction,
      confidence_level: Math.min(0.95, 0.6 + (walletData.risk_score / 10) * 0.35)
    };
  }

  // Generate mock transaction data
  private generateRecentTransactions(network: string, riskLevel: string) {
    const transactionCount = Math.floor(Math.random() * 5) + 3;
    return Array.from({ length: transactionCount }, (_, i) => ({
      direction: (Math.random() > 0.5 ? 'inbound' : 'outbound') as 'inbound' | 'outbound',
      amount: Math.random() * 100,
      risk_score: riskLevel === 'High' ? Math.random() * 4 + 6 : Math.random() * 6,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  // Create a new lookup record in Supabase
  async createLookupRecord(walletData: WalletRiskResponse): Promise<LookupRecord | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      const recentTransactions = this.generateRecentTransactions(walletData.network, walletData.risk_level);
      const totalInbound = recentTransactions
        .filter(tx => tx.direction === 'inbound')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const totalOutbound = recentTransactions
        .filter(tx => tx.direction === 'outbound')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const analysisData = {
        risk_assessment: {
          risk_score: walletData.risk_score,
          risk_level: walletData.risk_level,
          key_risk_factors: Object.entries(walletData.risk_factors)
            .filter(([_, value]) => value)
            .map(([key, _]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
          recent_transactions: recentTransactions,
          flow_analysis: {
            total_inbound: totalInbound,
            total_outbound: totalOutbound,
            net_flow: totalInbound - totalOutbound
          }
        },
        compliance_summary: this.generateComplianceSummary(walletData),
        analyst_fields: {
          case_notes: '',
          analyst_decision: 'pending',
          tags: [],
          attachments: []
        },
        processing_time_ms: walletData.processing_time_ms,
        full_wallet_data: walletData
      };

      const { data, error } = await supabase
        .from('investigation_records')
        .insert({
          user_id: user.id,
          wallet_address: walletData.address,
          network: walletData.network,
          risk_score: walletData.risk_score,
          risk_level: walletData.risk_level,
          analysis_data: analysisData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lookup record:', error);
        return null;
      }

      console.log('Created lookup record:', data);
      return this.transformToLookupRecord(data);
    } catch (error) {
      console.error('Error creating lookup record:', error);
      return null;
    }
  }

  // Transform Supabase record to LookupRecord format
  private transformToLookupRecord(data: any): LookupRecord {
    return {
      id: data.record_id,
      timestamp: data.created_at,
      wallet_address: data.wallet_address,
      network: data.network as 'BTC' | 'ETH',
      risk_assessment: data.analysis_data.risk_assessment,
      compliance_summary: data.analysis_data.compliance_summary,
      analyst_fields: data.analysis_data.analyst_fields,
      created_at: data.created_at,
      updated_at: data.updated_at,
      processing_time_ms: data.analysis_data.processing_time_ms || 0
    };
  }

  // Get all lookup records for the current user
  async getLookupRecords(filters?: any): Promise<LookupRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('investigation_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching lookup records:', error);
        return [];
      }

      return data?.map(record => this.transformToLookupRecord(record)) || [];
    } catch (error) {
      console.error('Error fetching lookup records:', error);
      return [];
    }
  }

  // Get a single lookup record by record_id
  async getLookupRecord(recordId: string): Promise<LookupRecord | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('record_id', recordId)
        .single();

      if (error) {
        console.error('Error fetching lookup record:', error);
        return null;
      }

      return data ? this.transformToLookupRecord(data) : null;
    } catch (error) {
      console.error('Error fetching lookup record:', error);
      return null;
    }
  }

  // Get lookup statistics
  async getLookupStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('investigation_records')
        .select('risk_level, analysis_data')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching lookup stats:', error);
        return null;
      }

      const total = data?.length || 0;
      const riskLevelCounts = data?.reduce((acc, record) => {
        acc[record.risk_level] = (acc[record.risk_level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const decisionCounts = data?.reduce((acc, record) => {
        const decision = record.analysis_data?.analyst_fields?.analyst_decision || 'pending';
        acc[decision] = (acc[decision] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total,
        risk_level_breakdown: riskLevelCounts,
        decision_breakdown: decisionCounts,
        pending_review: decisionCounts.pending || 0
      };
    } catch (error) {
      console.error('Error fetching lookup stats:', error);
      return null;
    }
  }
}

export const supabaseLookupRecordService = new SupabaseLookupRecordService();
