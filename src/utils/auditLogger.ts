
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  record_id: string | null;
  timestamp: string;
  metadata: Record<string, any>;
}

export async function logAuditAction(
  action: string,
  recordId?: string,
  metadata: Record<string, any> = {}
) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      console.warn('Cannot log audit action: User not authenticated');
      return;
    }

    const { error } = await supabase.from('audit_logs').insert([
      {
        user_id: user.id,
        action,
        record_id: recordId || null,
        metadata: metadata || {}
      },
    ]);

    if (error) {
      console.error('Failed to log audit action:', error);
    } else {
      console.log(`✅ Audit logged: ${action}`, { recordId, metadata });
    }
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
}

export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0,
  actionFilter?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AuditLogEntry[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionFilter) {
      query = query.ilike('action', `%${actionFilter}%`);
    }

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom);
    }

    if (dateTo) {
      query = query.lte('timestamp', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    // Transform the data to match our interface
    return (data || []).map(log => ({
      ...log,
      metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata || {}
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

export async function exportAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to export audit logs:', error);
      return [];
    }

    return (data || []).map(log => ({
      ...log,
      metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata || {}
    }));
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return [];
  }
}
