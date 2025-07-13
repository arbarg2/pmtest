
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
      console.log('Creating lookup record with data:', { 
        wallet_address: data.wallet_address, 
        network: data.network, 
        userId 
      });

      // Generate a record ID
      const recordId = `LR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const insertData = {
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
      };

      console.log('Inserting data:', insertData);

      const { data: record, error } = await supabase
        .from('investigation_records')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return { success: false, error: error.message, details: error };
      }

      if (!record) {
        console.error('No record returned from insert');
        return { success: false, error: 'No record returned from database' };
      }

      console.log('Successfully created record:', record);
      return { success: true, record };
    } catch (error) {
      console.error('Error in createLookupRecord:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create lookup record',
        details: error
      };
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

      return { success: true, records: records || [] };
    } catch (error) {
      console.error('Error in getLookupRecords:', error);
      return { success: false, error: 'Failed to fetch lookup records' };
    }
  }

  async getLookupRecordById(id: string, userId: string) {
    try {
      console.log('Fetching record by ID:', id, 'for user:', userId);
      
      // Try by record_id first (the display ID), then by internal id
      let { data: record, error } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('record_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching lookup record by record_id:', error);
        return { success: false, error: error.message };
      }

      // If not found by record_id, try by internal id
      if (!record) {
        console.log('Not found by record_id, trying by internal id');
        const result = await supabase
          .from('investigation_records')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .maybeSingle();
        
        record = result.data;
        if (result.error && result.error.code !== 'PGRST116') {
          console.error('Error fetching lookup record by id:', result.error);
          return { success: false, error: result.error.message };
        }
      }

      if (!record) {
        console.log('Record not found with either ID');
        return { success: false, error: 'Record not found' };
      }

      console.log('Found record:', record);
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

      const records = data || [];
      const stats = {
        total_lookups: records.length,
        high_risk: records.filter(r => r.risk_level === 'High').length,
        medium_risk: records.filter(r => r.risk_level === 'Medium').length,
        low_risk: records.filter(r => r.risk_level === 'Low').length
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error in getLookupRecordStats:', error);
      return { success: false, error: 'Failed to fetch stats' };
    }
  }

  async updateLookupRecord(recordId: string, userId: string, updates: Partial<CreateLookupRecordData>) {
    try {
      console.log('Updating record:', recordId, 'for user:', userId);
      
      const updateData = {
        analyst_notes: updates.analyst_fields?.case_notes,
        investigation_status: updates.analyst_fields?.analyst_decision,
        tags: updates.analyst_fields?.tags,
        updated_at: new Date().toISOString()
      };

      console.log('Update data:', updateData);

      // Try to update by record_id first
      let { data: record, error } = await supabase
        .from('investigation_records')
        .update(updateData)
        .eq('record_id', recordId)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      // If not found by record_id, try by internal id
      if (error && error.code === 'PGRST116') {
        console.log('Not found by record_id, trying by internal id');
        const result = await supabase
          .from('investigation_records')
          .update(updateData)
          .eq('id', recordId)
          .eq('user_id', userId)
          .select()
          .maybeSingle();
        
        record = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error updating lookup record:', error);
        return { success: false, error: error.message };
      }

      if (!record) {
        console.error('No record found to update');
        return { success: false, error: 'Record not found' };
      }

      console.log('Successfully updated record:', record);
      return { success: true, record };
    } catch (error) {
      console.error('Error in updateLookupRecord:', error);
      return { success: false, error: 'Failed to update lookup record' };
    }
  }
}

export const supabaseLookupRecords = new SupabaseLookupRecordsService();
