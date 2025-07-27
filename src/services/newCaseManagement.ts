
import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/utils/auditLogger';

export interface Case {
  id: string;
  case_id: string;
  case_name: string;
  status: 'new' | 'assigned' | 'in_progress' | 'pending_review' | 'cleared' | 'str_filed' | 'closed' | 'on_hold';
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  overall_risk_level: 'Low' | 'Medium' | 'High' | 'Critical' | null;
  user_id: string;
}

export interface CaseActivityLog {
  id: string;
  case_id: string;
  user_id: string;
  activity_type: string;
  activity_description: string;
  metadata: any;
  created_at: string;
}

export interface CreateCaseRequest {
  case_name: string;
  assigned_to?: string;
  overall_risk_level?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface UpdateCaseRequest {
  case_name?: string;
  status?: 'new' | 'assigned' | 'in_progress' | 'pending_review' | 'cleared' | 'str_filed' | 'closed' | 'on_hold';
  assigned_to?: string;
  overall_risk_level?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export async function getAllCases(): Promise<Case[]> {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
      throw error;
    }

    return (data || []) as Case[];
  } catch (error) {
    console.error('Failed to fetch cases:', error);
    throw error;
  }
}

export async function getCaseById(caseId: string): Promise<Case | null> {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error) {
      console.error('Error fetching case:', error);
      return null;
    }

    return data as Case;
  } catch (error) {
    console.error('Failed to fetch case:', error);
    return null;
  }
}

export async function createCase(
  request: CreateCaseRequest,
  userId: string
): Promise<{ success: boolean; case?: Case; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        case_name: request.case_name,
        assigned_to: request.assigned_to || null,
        overall_risk_level: request.overall_risk_level || null,
        created_by: userId,
        user_id: userId,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating case:', error);
      return { success: false, error: error.message };
    }

    // Log the case creation
    await logCaseActivity(data.id, userId, 'case_created', 'Case created', {
      case_name: request.case_name,
      assigned_to: request.assigned_to
    });

    return { success: true, case: data as Case };
  } catch (error) {
    console.error('Failed to create case:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateCase(
  caseId: string,
  request: UpdateCaseRequest,
  userId: string
): Promise<{ success: boolean; case?: Case; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('cases')
      .update({
        ...request,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating case:', error);
      return { success: false, error: error.message };
    }

    // Log the case update
    await logCaseActivity(caseId, userId, 'case_updated', 'Case updated', request);

    return { success: true, case: data as Case };
  } catch (error) {
    console.error('Failed to update case:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function logCaseActivity(
  caseId: string,
  userId: string,
  activityType: string,
  description: string,
  metadata: any = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('case_activity_log')
      .insert({
        case_id: caseId,
        user_id: userId,
        activity_type: activityType,
        activity_description: description,
        metadata
      });

    if (error) {
      console.error('Error logging case activity:', error);
    }
  } catch (error) {
    console.error('Failed to log case activity:', error);
  }
}

export async function getCaseActivityLog(caseId: string): Promise<CaseActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('case_activity_log')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching case activity log:', error);
      throw error;
    }

    return (data || []) as CaseActivityLog[];
  } catch (error) {
    console.error('Failed to fetch case activity log:', error);
    throw error;
  }
}

export async function linkLookupRecordToCase(
  recordId: string,
  caseId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('investigation_records')
      .update({ case_id_v2: caseId })
      .eq('id', recordId);

    if (error) {
      console.error('Error linking lookup record to case:', error);
      return { success: false, error: error.message };
    }

    // Log the linking activity
    await logCaseActivity(caseId, userId, 'record_linked', 'Lookup record linked to case', {
      record_id: recordId
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to link lookup record to case:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getCaseWithLookupRecords(caseId: string): Promise<{
  case: Case;
  lookupRecords: any[];
} | null> {
  try {
    // Get case details
    const caseData = await getCaseById(caseId);
    if (!caseData) return null;

    // Get linked lookup records
    const { data: lookupRecords, error } = await supabase
      .from('investigation_records')
      .select('*')
      .eq('case_id_v2', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lookup records for case:', error);
      throw error;
    }

    return {
      case: caseData,
      lookupRecords: lookupRecords || []
    };
  } catch (error) {
    console.error('Failed to fetch case with lookup records:', error);
    return null;
  }
}

export const newCaseManagementService = {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  logCaseActivity,
  getCaseActivityLog,
  linkLookupRecordToCase,
  getCaseWithLookupRecords
};
