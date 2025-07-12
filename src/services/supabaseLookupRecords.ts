
import { supabase } from '@/integrations/supabase/client';

export interface LookupRecord {
  id: string;
  record_id: string;
  wallet_address: string;
  network: string;
  risk_score: number;
  risk_level: string;
  processing_time_ms: number;
  risk_assessment: any;
  analyst_fields: {
    case_notes: string;
    analyst_decision: 'pending' | 'cleared' | 'blocked' | 'escalated';
    tags: string[];
    attachments: string[];
  };
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateLookupRecordData {
  wallet_address: string;
  network: string;
  risk_score: number;
  risk_level: string;
  processing_time_ms: number;
  risk_assessment: any;
  analyst_fields: {
    case_notes: string;
    analyst_decision: 'pending' | 'cleared' | 'blocked' | 'escalated';
    tags: string[];
    attachments: string[];
  };
}

class SupabaseLookupRecordsService {
  async createLookupRecord(data: CreateLookupRecordData, userId: string) {
    try {
      // Generate a record ID
      const recordId = `LR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: record, error } = await supabase
        .from('investigation_records')
        .insert({
          record_id: recordId,
          wallet_address: data.wallet_address,
          network: data.network,
          risk_score: data.risk_score,
          risk_level: data.risk_level,
          analysis_data: data.risk_assessment,
          analyst_notes: data.analyst_fields.case_notes,
          investigation_status: data.analyst_fields.analyst_decision,
          tags: data.analyst_fields.tags,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lookup record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, record };
    } catch (error) {
      console.error('Error in createLookupRecord:', error);
      return { success: false, error: 'Failed to create lookup record' };
    }
  }

  async getLookupRecords(userId: string) {
    try {
      const { data: records, error } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lookup records:', error);
        return { success: false, error: error.message };
      }

      return { success: true, records };
    } catch (error) {
      console.error('Error in getLookupRecords:', error);
      return { success: false, error: 'Failed to fetch lookup records' };
    }
  }

  async getLookupRecordById(id: string, userId: string) {
    try {
      const { data: record, error } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('record_id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching lookup record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, record };
    } catch (error) {
      console.error('Error in getLookupRecordById:', error);
      return { success: false, error: 'Failed to fetch lookup record' };
    }
  }

  async getLookupRecordStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('investigation_records')
        .select('risk_level')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        total_lookups: data.length,
        high_risk: data.filter(r => r.risk_level === 'High').length,
        medium_risk: data.filter(r => r.risk_level === 'Medium').length,
        low_risk: data.filter(r => r.risk_level === 'Low').length
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error in getLookupRecordStats:', error);
      return { success: false, error: 'Failed to fetch stats' };
    }
  }

  async updateLookupRecord(id: string, userId: string, updates: Partial<CreateLookupRecordData>) {
    try {
      const { data: record, error } = await supabase
        .from('investigation_records')
        .update({
          analyst_notes: updates.analyst_fields?.case_notes,
          investigation_status: updates.analyst_fields?.analyst_decision,
          tags: updates.analyst_fields?.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating lookup record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, record };
    } catch (error) {
      console.error('Error in updateLookupRecord:', error);
      return { success: false, error: 'Failed to update lookup record' };
    }
  }
}

export const supabaseLookupRecords = new SupabaseLookupRecordsService();
