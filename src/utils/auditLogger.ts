
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  record_id?: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export async function logAuditAction(
  action: string,
  recordId?: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      console.warn('Cannot log audit action: user not authenticated');
      return;
    }

    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        action,
        record_id: recordId,
        metadata
      }]);

    if (error) {
      console.error('Failed to log audit action:', error);
    } else {
      console.log(`Audit log created: ${action}`, { recordId, metadata });
    }
  } catch (error) {
    console.error('Exception in audit logging:', error);
  }
}

export async function getAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching audit logs:', error);
    return [];
  }
}
