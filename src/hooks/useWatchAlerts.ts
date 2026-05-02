import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WatchAlert {
  id: string;
  watched_wallet_id: string;
  alert_type: string;
  old_value: string | null;
  new_value: string | null;
  risk_change: number | null;
  alert_message: string | null;
  is_read: boolean;
  created_at: string;
  // joined
  wallet_address?: string;
  network?: string;
}

export function useWatchAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<WatchAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("watch_alerts")
      .select(
        `id, watched_wallet_id, alert_type, old_value, new_value, risk_change, alert_message, is_read, created_at,
         watched_wallets!inner ( wallet_address, network, user_id )`,
      )
      .eq("watched_wallets.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("load alerts error", error);
      setLoading(false);
      return;
    }
    const mapped: WatchAlert[] = (data ?? []).map((r: any) => ({
      id: r.id,
      watched_wallet_id: r.watched_wallet_id,
      alert_type: r.alert_type,
      old_value: r.old_value,
      new_value: r.new_value,
      risk_change: r.risk_change,
      alert_message: r.alert_message,
      is_read: r.is_read,
      created_at: r.created_at,
      wallet_address: r.watched_wallets?.wallet_address,
      network: r.watched_wallets?.network,
    }));
    setAlerts(mapped);
    setLoading(false);
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    await supabase.from("watch_alerts").update({ is_read: true }).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unreadIds.length === 0) return;
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    await supabase.from("watch_alerts").update({ is_read: true }).in("id", unreadIds);
  }, [alerts]);

  useEffect(() => {
    if (!user) return;
    load();

    const channel = supabase
      .channel("watch-alerts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "watch_alerts" },
        async (payload) => {
          const row: any = payload.new;
          // Verify the alert belongs to this user via the watched wallet
          const { data: ww } = await supabase
            .from("watched_wallets")
            .select("wallet_address, network, user_id")
            .eq("id", row.watched_wallet_id)
            .maybeSingle();
          if (!ww || ww.user_id !== user.id) return;

          const enriched: WatchAlert = {
            ...row,
            wallet_address: ww.wallet_address,
            network: ww.network,
          };
          setAlerts((prev) => [enriched, ...prev].slice(0, 50));
          toast(`New alert · ${ww.wallet_address.slice(0, 10)}…`, {
            description: row.alert_message ?? row.alert_type,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return { alerts, unreadCount, loading, markRead, markAllRead, refresh: load };
}
