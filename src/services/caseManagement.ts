
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CaseCreationResult {
  success: boolean;
  caseId?: string;
  error?: string;
}

export interface CaseAuditEntry {
  id: string;
  case_id: string;
  user_id: string;
  action: string;
  details?: any;
  created_at: string;
}

class CaseManagementService {
  async createCase(recordId: string, userId: string): Promise<CaseCreationResult> {
    try {
      console.log('Creating case for record:', recordId, 'user:', userId);
      
      // Generate case ID using database function
      const { data: caseIdResult, error: caseIdError } = await supabase
        .rpc('generate_case_id');
      
      if (caseIdError) {
        console.error('Error generating case ID:', caseIdError);
        return { success: false, error: 'Failed to generate case ID' };
      }
      
      const caseId = caseIdResult;
      
      // Update the record to make it a case
      const { data: record, error } = await supabase
        .from('investigation_records')
        .update({
          is_case: true,
          case_id: caseId,
          case_created_at: new Date().toISOString(),
          case_status: 'open'
        })
        .eq('id', recordId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating case:', error);
        return { success: false, error: error.message };
      }
      
      // Log case creation in audit log
      await this.logCaseAction(caseId, userId, 'case_created', {
        record_id: recordId,
        status: 'open'
      });
      
      console.log('Case created successfully:', caseId);
      return { success: true, caseId };
    } catch (error) {
      console.error('Error in createCase:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async updateCaseStatus(recordId: string, userId: string, status: string): Promise<boolean> {
    try {
      const { data: record, error } = await supabase
        .from('investigation_records')
        .update({ case_status: status })
        .eq('id', recordId)
        .eq('user_id', userId)
        .eq('is_case', true)
        .select('case_id')
        .single();
      
      if (error) {
        console.error('Error updating case status:', error);
        return false;
      }
      
      // Log status change
      if (record?.case_id) {
        await this.logCaseAction(record.case_id, userId, 'status_changed', {
          new_status: status,
          record_id: recordId
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateCaseStatus:', error);
      return false;
    }
  }

  async assignCase(recordId: string, userId: string, assignedTo: string): Promise<boolean> {
    try {
      const { data: record, error } = await supabase
        .from('investigation_records')
        .update({ assigned_to: assignedTo })
        .eq('id', recordId)
        .eq('user_id', userId)
        .eq('is_case', true)
        .select('case_id')
        .single();
      
      if (error) {
        console.error('Error assigning case:', error);
        return false;
      }
      
      // Log assignment
      if (record?.case_id) {
        await this.logCaseAction(record.case_id, userId, 'case_assigned', {
          assigned_to: assignedTo,
          record_id: recordId
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error in assignCase:', error);
      return false;
    }
  }

  async getCaseAuditLog(caseId: string): Promise<CaseAuditEntry[]> {
    try {
      const { data: logs, error } = await supabase
        .from('case_audit_log')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching audit log:', error);
        return [];
      }
      
      return logs || [];
    } catch (error) {
      console.error('Error in getCaseAuditLog:', error);
      return [];
    }
  }

  private async logCaseAction(caseId: string, userId: string, action: string, details?: any): Promise<void> {
    try {
      await supabase
        .from('case_audit_log')
        .insert({
          case_id: caseId,
          user_id: userId,
          action,
          details
        });
    } catch (error) {
      console.error('Error logging case action:', error);
      // Don't throw error here as it shouldn't block the main operation
    }
  }

  async getCases(userId: string) {
    try {
      const { data: cases, error } = await supabase
        .from('investigation_records')
        .select('*')
        .eq('user_id', userId)
        .eq('is_case', true)
        .order('case_created_at', { ascending: false });

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
}

export const caseManagementService = new CaseManagementService();
