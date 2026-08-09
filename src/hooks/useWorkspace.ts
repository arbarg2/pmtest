import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type WorkspaceRole = 'owner' | 'compliance_officer' | 'analyst' | 'legal' | 'viewer';

export interface WorkspaceInfo {
  id: string;
  name: string;
  role: WorkspaceRole;
}

/** Resolves the signed-in user's active workspace and their role within it. */
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setWorkspace(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from('workspace_members')
        .select('role, workspace_id, workspaces(id, name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        const ws = (data as any).workspaces;
        setWorkspace({
          id: (data as any).workspace_id,
          name: ws?.name ?? 'Workspace',
          role: (data as any).role as WorkspaceRole,
        });
      } else {
        setWorkspace(null);
      }
      setLoading(false);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const can = (action: 'manage_workspace' | 'manage_webhooks' | 'file_sar' | 'edit_cases' | 'view') => {
    const role = workspace?.role;
    if (!role) return false;
    switch (action) {
      case 'manage_workspace':
      case 'manage_webhooks':
        return role === 'owner' || role === 'compliance_officer';
      case 'file_sar':
        return role === 'owner' || role === 'compliance_officer' || role === 'legal';
      case 'edit_cases':
        return role !== 'viewer' && role !== 'legal';
      default:
        return true;
    }
  };

  return { workspace, loading, can };
}
