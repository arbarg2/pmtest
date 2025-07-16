import { supabase } from '@/integrations/supabase/client';
import { logAuditAction } from '@/utils/auditLogger';

export interface CaseRecord {
  id: string;
  record_id: string;
  case_id: string;
  wallet_address: string;
  network: string;
  risk_score: number;
  risk_level: string;
  analysis_data: any;
  user_id: string;
  created_at: string;
  updated_at: string;
  case_status: string;
  investigation_status: string;
  analyst_notes: string;
  assigned_to: string | null;
  analyst_id: string | null;
  reviewed_at: string | null;
  case_created_at: string | null;
  is_case: boolean;
  tags: string[];
}

export interface CaseAssignment {
  caseId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
  notes?: string;
}

export interface CaseNote {
  id: string;
  case_id: string;
  user_id: string;
  note: string;
  created_at: string;
  author_name?: string;
}

export async function getAllCases(): Promise<CaseRecord[]> {
  try {
    const { data, error } = await supabase
      .from('investigation_records')
      .select('*')
      .eq('is_case', true)
      .order('case_created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch cases:', error);
    throw error;
  }
}

export async function getCaseById(caseId: string): Promise<CaseRecord | null> {
  try {
    const { data, error } = await supabase
      .from('investigation_records')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (error) {
      console.error('Error fetching case:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch case:', error);
    return null;
  }
}

export async function createCase(
  recordId: string,
  assignee?: string,
  initialNote?: string
): Promise<{ success: boolean; caseId?: string; error?: string }> {
  try {
    console.log('🔍 Creating case for record:', recordId);
    
    // First, find the record by record_id (display ID like LR_250716_001)
    const { data: existingRecord, error: fetchError } = await supabase
      .from('investigation_records')
      .select('*')
      .eq('record_id', recordId)
      .single();

    if (fetchError || !existingRecord) {
      console.error('❌ Record not found:', fetchError);
      return { success: false, error: 'Record not found or access denied' };
    }

    // Generate a unique case ID
    const { data: caseIdData, error: caseIdError } = await supabase
      .rpc('generate_case_id');

    if (caseIdError || !caseIdData) {
      console.error('❌ Failed to generate case ID:', caseIdError);
      return { success: false, error: 'Failed to generate case ID' };
    }

    const caseId = caseIdData;
    console.log('✅ Generated case ID:', caseId);

    // Update the record to make it a case
    const { error: updateError } = await supabase
      .from('investigation_records')
      .update({
        is_case: true,
        case_id: caseId,
        case_status: 'open',
        case_created_at: new Date().toISOString(),
        assigned_to: assignee || null,
        analyst_notes: initialNote || '',
        investigation_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingRecord.id);

    if (updateError) {
      console.error('❌ Failed to update record:', updateError);
      return { success: false, error: 'Failed to create case' };
    }

    console.log('✅ Case created successfully:', caseId);

    // Log the case creation
    await logAuditAction('create_case', caseId, {
      record_id: recordId,
      wallet_address: existingRecord.wallet_address,
      assigned_to: assignee,
      status: 'open'
    });

    return { success: true, caseId };
  } catch (error) {
    console.error('❌ Error creating case:', error);
    return { success: false, error: 'Failed to create case' };
  }
}

export async function updateCaseStatus(
  caseId: string,
  status: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the case record by case_id
    const { data: caseRecord, error: fetchError } = await supabase
      .from('investigation_records')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (fetchError || !caseRecord) {
      console.error('❌ Case not found:', fetchError);
      return { success: false, error: 'Case not found or access denied' };
    }

    const updateData: any = {
      case_status: status,
      updated_at: new Date().toISOString()
    };

    if (note) {
      updateData.analyst_notes = caseRecord.analyst_notes 
        ? `${caseRecord.analyst_notes}\n\n[${new Date().toISOString()}] ${note}`
        : note;
    }

    if (status === 'closed') {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('investigation_records')
      .update(updateData)
      .eq('id', caseRecord.id);

    if (updateError) {
      console.error('❌ Failed to update case status:', updateError);
      return { success: false, error: 'Failed to update case status' };
    }

    // Log the status change
    await logAuditAction('update_case_status', caseId, {
      old_status: caseRecord.case_status,
      new_status: status,
      note: note,
      wallet_address: caseRecord.wallet_address
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error updating case status:', error);
    return { success: false, error: 'Failed to update case status' };
  }
}

export async function assignCase(
  caseId: string,
  assigneeId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the case record by case_id
    const { data: caseRecord, error: fetchError } = await supabase
      .from('investigation_records')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (fetchError || !caseRecord) {
      console.error('❌ Case not found:', fetchError);
      return { success: false, error: 'Case not found or access denied' };
    }

    const updateData: any = {
      assigned_to: assigneeId,
      analyst_id: assigneeId,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.analyst_notes = caseRecord.analyst_notes 
        ? `${caseRecord.analyst_notes}\n\n[${new Date().toISOString()}] Assignment: ${notes}`
        : `Assignment: ${notes}`;
    }

    const { error: updateError } = await supabase
      .from('investigation_records')
      .update(updateData)
      .eq('id', caseRecord.id);

    if (updateError) {
      console.error('❌ Failed to assign case:', updateError);
      return { success: false, error: 'Failed to assign case' };
    }

    // Log the assignment
    await logAuditAction('assign_case', caseId, {
      assigned_to: assigneeId,
      notes: notes,
      wallet_address: caseRecord.wallet_address
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error assigning case:', error);
    return { success: false, error: 'Failed to assign case' };
  }
}

export async function addCaseNote(
  caseId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: caseRecord, error: fetchError } = await supabase
      .from('investigation_records')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (fetchError || !caseRecord) {
      return { success: false, error: 'Case not found or access denied' };
    }

    const updatedNotes = caseRecord.analyst_notes 
      ? `${caseRecord.analyst_notes}\n\n[${new Date().toISOString()}] ${note}`
      : note;

    const { error: updateError } = await supabase
      .from('investigation_records')
      .update({
        analyst_notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseRecord.id);

    if (updateError) {
      return { success: false, error: 'Failed to add note' };
    }

    // Log the note addition
    await logAuditAction('add_case_note', caseId, {
      note: note,
      wallet_address: caseRecord.wallet_address
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding case note:', error);
    return { success: false, error: 'Failed to add note' };
  }
}

// Create a service object that wraps all the functions
export const caseManagementService = {
  getAllCases,
  getCaseById,
  createCase,
  updateCaseStatus,
  assignCase,
  addCaseNote,
  // Add a getCases method that wraps getAllCases for compatibility
  getCases: async (userId: string) => {
    try {
      const cases = await getAllCases();
      return { success: true, cases };
    } catch (error) {
      console.error('Error in getCases:', error);
      return { success: false, error: 'Failed to fetch cases' };
    }
  }
};
