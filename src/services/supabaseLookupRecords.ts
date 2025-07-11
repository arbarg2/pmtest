
import { supabase } from '@/integrations/supabase/client';
import { WalletRiskResponse } from './api';

export interface LookupRecord {
  id: string;
  timestamp: string;
  wallet_address: string;
  network: 'BTC' | 'ETH';
  risk_assessment: {
    risk_score: number;
    risk_level: 'Low' | 'Medium' | 'High';
    key_risk_factors: string[];
    recent_transactions: Array<{
      direction: 'inbound' | 'outbound';
      amount: number;
      risk_score: number;
      timestamp: string;
    }>;
    flow_analysis: {
      total_inbound: number;
      total_outbound: number;
      net_flow: number;
    };
  };
  compliance_summary: {
    explanation: string;
    regulatory_relevance: string[];
    suggested_action: 'approve' | 'pending' | 'reject';
    confidence_level: number;
  };
  analyst_fields: {
    case_notes: string;
    analyst_decision: 'approve' | 'pending' | 'reject';
    tags: string[];
    attachments: string[];
  };
  created_at: string;
  updated_at: string;
  processing_time_ms: number;
}

export interface LookupRecordFilters {
  risk_level?: string[];
  network?: string[];
  analyst_decision?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

export interface LookupRecordStats {
  total_lookups: number;
  risk_level_distribution: Record<string, number>;
  network_distribution: Record<string, number>;
  analyst_decision_distribution: Record<string, number>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}

class SupabaseLookupRecordsService {
  async saveLookupRecord(
    walletAddress: string,
    walletData: WalletRiskResponse,
    userId: string
  ): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      console.log('Saving lookup record to Supabase:', {
        wallet_address: walletAddress,
        network: walletData.network,
        risk_score: walletData.risk_score,
        risk_level: walletData.risk_level,
        user_id: userId
      });

      // Generate a unique record ID if not provided
      const recordId = `LR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare analysis data structure
      const analysisData = {
        risk_assessment: {
          risk_score: walletData.risk_score,
          risk_level: walletData.risk_level,
          key_risk_factors: [
            ...(walletData.risk_factors.sanctioned ? ['OFAC sanctions exposure'] : []),
            ...(walletData.risk_factors.fraud_reports ? ['Fraud reports'] : []),
            ...(walletData.risk_factors.dark_market_exposure ? ['Dark market exposure'] : []),
            ...(walletData.risk_factors.mixer_usage ? ['Mixer usage'] : []),
            ...(walletData.risk_factors.high_frequency_trading ? ['High frequency trading'] : [])
          ],
          recent_transactions: [],
          flow_analysis: {
            total_inbound: 0,
            total_outbound: 0,
            net_flow: 0
          }
        },
        compliance_summary: {
          explanation: `Risk assessment completed for ${walletAddress} on ${walletData.network} network.`,
          regulatory_relevance: [],
          suggested_action: 'pending' as const,
          confidence_level: 0.85
        },
        analyst_fields: {
          case_notes: '',
          analyst_decision: 'pending' as const,
          tags: [],
          attachments: []
        },
        processing_time_ms: walletData.processing_time_ms,
        full_wallet_data: JSON.parse(JSON.stringify(walletData))
      };

      const { data, error } = await supabase
        .from('investigation_records')
        .insert({
          record_id: recordId,
          user_id: userId,
          wallet_address: walletAddress,
          network: walletData.network,
          risk_score: walletData.risk_score,
          risk_level: walletData.risk_level,
          analysis_data: analysisData as any
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving lookup record:', error);
        return { success: false, error: error.message };
      }

      console.log('Lookup record saved successfully:', data);
      return { success: true, recordId: data.record_id };

    } catch (err) {
      console.error('Unexpected error saving lookup record:', err);
      return { success: false, error: 'Failed to save lookup record' };
    }
  }

  // Transform Supabase record to LookupRecord format
  private transformToLookupRecord(data: any): LookupRecord {
    const analysisData = data.analysis_data as any;
    
    return {
      id: data.record_id,
      timestamp: data.created_at,
      wallet_address: data.wallet_address,
      network: data.network as 'BTC' | 'ETH',
      risk_assessment: analysisData.risk_assessment || {
        risk_score: data.risk_score,
        risk_level: data.risk_level,
        key_risk_factors: [],
        recent_transactions: [],
        flow_analysis: { total_inbound: 0, total_outbound: 0, net_flow: 0 }
      },
      compliance_summary: analysisData.compliance_summary || {
        explanation: '',
        regulatory_relevance: [],
        suggested_action: 'pending' as const,
        confidence_level: 0
      },
      analyst_fields: analysisData.analyst_fields || {
        case_notes: '',
        analyst_decision: 'pending' as const,
        tags: [],
        attachments: []
      },
      created_at: data.created_at,
      updated_at: data.updated_at,
      processing_time_ms: analysisData.processing_time_ms || 0
    };
  }

  async getLookupRecords(
    userId: string,
    filters: LookupRecordFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ records: LookupRecord[]; total: number; error?: string }> {
    try {
      let query = supabase
        .from('investigation_records')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.risk_level?.length) {
        query = query.in('risk_level', filters.risk_level);
      }

      if (filters.network?.length) {
        query = query.in('network', filters.network);
      }

      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching lookup records:', error);
        return { records: [], total: 0, error: error.message };
      }

      const records = data?.map(this.transformToLookupRecord) || [];
      return { records, total: count || 0 };

    } catch (err) {
      console.error('Unexpected error fetching lookup records:', err);
      return { records: [], total: 0, error: 'Failed to fetch lookup records' };
    }
  }

  async getLookupRecordById(recordId: string, userId: string): Promise<{ record?: LookupRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('record_id', recordId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching lookup record:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Record not found' };
      }

      return { record: this.transformToLookupRecord(data) };

    } catch (err) {
      console.error('Unexpected error fetching lookup record:', err);
      return { error: 'Failed to fetch lookup record' };
    }
  }

  async updateLookupRecord(
    recordId: string,
    userId: string,
    updates: Partial<Pick<LookupRecord, 'analyst_fields' | 'compliance_summary'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the current record to merge the updates
      const { data: currentData, error: fetchError } = await supabase
        .from('investigation_records')
        .select('analysis_data')
        .eq('record_id', recordId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      const currentAnalysisData = currentData.analysis_data as any;
      const updatedAnalysisData = {
        ...currentAnalysisData,
        ...(updates.analyst_fields && { analyst_fields: updates.analyst_fields }),
        ...(updates.compliance_summary && { compliance_summary: updates.compliance_summary })
      };

      const { error } = await supabase
        .from('investigation_records')
        .update({
          analysis_data: updatedAnalysisData as any,
          updated_at: new Date().toISOString()
        })
        .eq('record_id', recordId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating lookup record:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (err) {
      console.error('Unexpected error updating lookup record:', err);
      return { success: false, error: 'Failed to update lookup record' };
    }
  }

  async deleteLookupRecord(recordId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('investigation_records')
        .delete()
        .eq('record_id', recordId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting lookup record:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (err) {
      console.error('Unexpected error deleting lookup record:', err);
      return { success: false, error: 'Failed to delete lookup record' };
    }
  }

  async getLookupRecordStats(userId: string): Promise<{ stats?: LookupRecordStats; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('investigation_records')
        .select('risk_level, network, analysis_data, created_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching lookup record stats:', error);
        return { error: error.message };
      }

      const riskLevelCounts = data?.reduce((acc, record) => {
        acc[record.risk_level] = (acc[record.risk_level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const networkCounts = data?.reduce((acc, record) => {
        acc[record.network] = (acc[record.network] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const decisionCounts = data?.reduce((acc, record) => {
        const analysisData = record.analysis_data as any;
        const decision = analysisData?.analyst_fields?.analyst_decision || 'pending';
        acc[decision] = (acc[decision] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate recent activity (last 7 days)
      const recentActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = data?.filter(record => 
          record.created_at.startsWith(dateStr)
        ).length || 0;

        return { date: dateStr, count };
      }).reverse();

      const stats: LookupRecordStats = {
        total_lookups: data?.length || 0,
        risk_level_distribution: riskLevelCounts,
        network_distribution: networkCounts,
        analyst_decision_distribution: decisionCounts,
        recent_activity: recentActivity
      };

      return { stats };

    } catch (err) {
      console.error('Unexpected error fetching lookup record stats:', err);
      return { error: 'Failed to fetch lookup record stats' };
    }
  }
}

export const supabaseLookupRecords = new SupabaseLookupRecordsService();
