import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/utils/auditLogger';

export interface CaseRecord {
  id: string;
  record_id: string;
  wallet_address: string;
  network: string;
  risk_level: string;
  risk_score: number;
  case_status: string;
  case_created_at: string;
  analyst_notes: string;
  tags: string[];
}

interface CaseCreationResult {
  success: boolean;
  caseId?: string;
  record?: any;
  error?: string;
}

class CaseManagementService {
  async createCase(recordId: string, userId: string): Promise<CaseCreationResult> {
    try {
      console.log('Creating case for record:', recordId, 'user:', userId);
      
      // First, get the record to ensure it exists and the user has access
      const { data: existingRecord, error: recordError } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('record_id', recordId)
        .eq('user_id', userId)
        .single();
      
      if (recordError) {
        console.error('Error fetching record:', recordError);
        return { success: false, error: 'Failed to fetch record' };
      }
      
      if (!existingRecord) {
        console.error('Record not found');
        return { success: false, error: 'Record not found or access denied' };
      }
      
      // Check if already a case
      if (existingRecord.is_case) {
        return { success: false, error: 'Record is already a case' };
      }
      
      // Generate case ID
      const { data: caseIdResult, error: caseIdError } = await supabase.rpc('generate_case_id');
      
      if (caseIdError || !caseIdResult) {
        console.error('Error generating case ID:', caseIdError);
        return { success: false, error: 'Failed to generate case ID' };
      }
      
      const caseId = caseIdResult;
      
      // Update the record to make it a case using the internal UUID
      const { data: record, error } = await supabase
        .from('investigation_records')
        .update({
          is_case: true,
          case_id: caseId,
          case_created_at: new Date().toISOString(),
          case_status: 'open'
        })
        .eq('id', existingRecord.id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating case:', error);
        return { success: false, error: 'Failed to create case' };
      }
      
      // Log case creation in audit log
      await this.logCaseAction(caseId, userId, 'case_created', {
        record_id: existingRecord.id,
        status: 'open'
      });

      // Log audit action
      await logAuditAction('create_case', existingRecord.record_id, {
        case_id: caseId,
        wallet_address: existingRecord.wallet_address,
        network: existingRecord.network,
        risk_level: existingRecord.risk_level
      });
      
      return { success: true, caseId, record };
    } catch (error) {
      console.error('Exception in createCase:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async updateCaseStatus(recordId: string, userId: string, status: string): Promise<boolean> {
    try {
      // First, get the record to ensure it exists and the user has access
      const { data: record, error: recordError } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('record_id', recordId)
        .eq('user_id', userId)
        .single();
      
      if (recordError) {
        console.error('Error fetching record:', recordError);
        return false;
      }
      
      if (!record) {
        console.error('Record not found');
        return false;
      }
      
      // Update the record with the new status
      const { error } = await supabase
        .from('investigation_records')
        .update({
          case_status: status
        })
        .eq('record_id', recordId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error updating case status:', error);
        return false;
      }
      
      if (record?.case_id) {
        await this.logCaseAction(record.case_id, userId, 'status_updated', {
          new_status: status,
          record_id: recordId
        });

        // Log audit action
        await logAuditAction('update_case_status', recordId, {
          case_id: record.case_id,
          new_status: status,
          previous_status: 'unknown' // Could be enhanced to track previous status
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateCaseStatus:', error);
      return false;
    }
  }

  async getCases(userId: string): Promise<{ success: boolean; cases?: CaseRecord[]; error?: string }> {
    try {
      const { data: cases, error } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('user_id', userId)
        .eq('is_case', true);

      if (error) {
        console.error('Error fetching cases:', error);
        return { success: false, error: error.message };
      }

      return { success: true, cases: cases || [] };
    } catch (error) {
      console.error('Error in getCases:', error);
      return { success: false, error: 'Failed to fetch cases' };
    }
  }

  private async logCaseAction(caseId: string, userId: string, action: string, metadata: Record<string, any>) {
    try {
      const { error } = await supabase
        .from('case_actions')
        .insert([{
          case_id: caseId,
          user_id: userId,
          action,
          timestamp: new Date().toISOString(),
          metadata
        }]);

      if (error) {
        console.error('Failed to log case action:', error);
      }
    } catch (error) {
      console.error('Exception in case action logging:', error);
    }
  }
}

export const caseManagementService = new CaseManagementService();
