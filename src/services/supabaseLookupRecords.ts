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
      console.log('🔄 Creating lookup record with detailed data:', { 
        wallet_address: data.wallet_address, 
        network: data.network, 
        userId,
        risk_level: data.risk_level,
        risk_score: data.risk_score,
        processing_time_ms: data.processing_time_ms
      });

      // Validate required fields
      if (!data.wallet_address || !data.network || !userId) {
        const missingFields = [];
        if (!data.wallet_address) missingFields.push('wallet_address');
        if (!data.network) missingFields.push('network');
        if (!userId) missingFields.push('userId');
        
        console.error('❌ Missing required fields:', missingFields);
        return { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        };
      }

      // Ensure network value matches database constraint
      const validNetworks = ['ethereum', 'bitcoin', 'ETH', 'BTC', 'eth', 'btc'];
      if (!validNetworks.includes(data.network)) {
        console.error('❌ Invalid network value:', data.network);
        return { 
          success: false, 
          error: `Invalid network value: ${data.network}. Must be one of: ${validNetworks.join(', ')}` 
        };
      }

      // Ensure risk level is valid
      const validRiskLevels = ['Low', 'Medium', 'High', 'Critical'];
      if (!validRiskLevels.includes(data.risk_level)) {
        console.error('❌ Invalid risk level:', data.risk_level);
        return { 
          success: false, 
          error: `Invalid risk level: ${data.risk_level}. Must be one of: ${validRiskLevels.join(', ')}` 
        };
      }

      // Validate risk score is a number
      const riskScore = Number(data.risk_score);
      if (isNaN(riskScore) || riskScore < 0 || riskScore > 10) {
        console.error('❌ Invalid risk score:', data.risk_score);
        return { 
          success: false, 
          error: `Invalid risk score: ${data.risk_score}. Must be a number between 0 and 10` 
        };
      }

      // Include record_id as empty string - the database trigger will generate it
      const insertData = {
        record_id: '', // Database trigger will override this
        wallet_address: data.wallet_address.trim(),
        network: data.network,
        risk_score: riskScore,
        risk_level: data.risk_level,
        analysis_data: data.risk_assessment,
        analyst_notes: data.analyst_fields.case_notes || '',
        investigation_status: data.analyst_fields.analyst_decision || 'pending',
        tags: data.analyst_fields.tags || [],
        user_id: userId
      };

      console.log('📤 Sending insert data to database:', {
        ...insertData,
        analysis_data: insertData.analysis_data ? 'Present' : 'Missing'
      });

      // Use a more robust insert approach with better error handling
      const { data: record, error } = await supabase
        .from('investigation_records')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Check for duplicate key error specifically
        if (error.code === '23505' && error.message.includes('investigation_records_record_id_key')) {
          return {
            success: false,
            error: 'Duplicate record ID generated, please retry',
            code: '23505',
            details: error
          };
        }
        
        return { 
          success: false, 
          error: `Database error: ${error.message}`, 
          details: error,
          code: error.code 
        };
      }

      if (!record) {
        console.error('❌ No record returned from insert');
        return { success: false, error: 'No record returned from database' };
      }

      console.log('✅ Successfully created record:', {
        id: record.id,
        record_id: record.record_id,
        wallet_address: record.wallet_address,
        network: record.network,
        risk_level: record.risk_level
      });
      
      return { success: true, record };
    } catch (error) {
      console.error('❌ Exception in createLookupRecord:', error);
      
      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Network error: Failed to connect to database',
          code: 'NETWORK_ERROR',
          details: error
        };
      }
      
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
