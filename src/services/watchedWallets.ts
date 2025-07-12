
import { supabase } from '@/integrations/supabase/client';

export interface WatchedWallet {
  id: string;
  wallet_address: string;
  network: string;
  watch_reason?: string;
  initial_risk_score?: number;
  current_risk_score?: number;
  last_checked: string;
  status: 'active' | 'paused' | 'removed';
  alert_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface WatchAlert {
  id: string;
  alert_type: string;
  old_value?: string;
  new_value?: string;
  risk_change?: number;
  alert_message?: string;
  is_read: boolean;
  created_at: string;
  watched_wallet: WatchedWallet;
}

class WatchedWalletsService {
  async addWatchedWallet(
    walletAddress: string,
    network: string,
    watchReason: string,
    initialRiskScore: number,
    alertThreshold: number = 0.5
  ): Promise<WatchedWallet | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('watched_wallets')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress,
          network,
          watch_reason: watchReason,
          initial_risk_score: initialRiskScore,
          current_risk_score: initialRiskScore,
          alert_threshold: alertThreshold
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        wallet_address: data.wallet_address,
        network: data.network,
        watch_reason: data.watch_reason,
        initial_risk_score: data.initial_risk_score,
        current_risk_score: data.current_risk_score,
        last_checked: data.last_checked,
        status: data.status as 'active' | 'paused' | 'removed',
        alert_threshold: data.alert_threshold,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error adding watched wallet:', error);
      return null;
    }
  }

  async getWatchedWallets(userId?: string): Promise<WatchedWallet[]> {
    try {
      const { data, error } = await supabase
        .from('watched_wallets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(wallet => ({
        id: wallet.id,
        wallet_address: wallet.wallet_address,
        network: wallet.network,
        watch_reason: wallet.watch_reason,
        initial_risk_score: wallet.initial_risk_score,
        current_risk_score: wallet.current_risk_score,
        last_checked: wallet.last_checked,
        status: wallet.status as 'active' | 'paused' | 'removed',
        alert_threshold: wallet.alert_threshold,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at
      }));
    } catch (error) {
      console.error('Error fetching watched wallets:', error);
      return [];
    }
  }

  async updateWatchedWallet(id: string, updates: Partial<WatchedWallet>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('watched_wallets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating watched wallet:', error);
      return false;
    }
  }

  async removeWatchedWallet(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('watched_wallets')
        .update({ status: 'removed' })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing watched wallet:', error);
      return false;
    }
  }

  async getWatchAlerts(limit: number = 50): Promise<WatchAlert[]> {
    try {
      const { data, error } = await supabase
        .from('watch_alerts')
        .select(`
          *,
          watched_wallet:watched_wallets(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(alert => ({
        id: alert.id,
        alert_type: alert.alert_type,
        old_value: alert.old_value,
        new_value: alert.new_value,
        risk_change: alert.risk_change,
        alert_message: alert.alert_message,
        is_read: alert.is_read,
        created_at: alert.created_at,
        watched_wallet: {
          id: alert.watched_wallet.id,
          wallet_address: alert.watched_wallet.wallet_address,
          network: alert.watched_wallet.network,
          watch_reason: alert.watched_wallet.watch_reason,
          initial_risk_score: alert.watched_wallet.initial_risk_score,
          current_risk_score: alert.watched_wallet.current_risk_score,
          last_checked: alert.watched_wallet.last_checked,
          status: alert.watched_wallet.status as 'active' | 'paused' | 'removed',
          alert_threshold: alert.watched_wallet.alert_threshold,
          created_at: alert.watched_wallet.created_at,
          updated_at: alert.watched_wallet.updated_at
        }
      }));
    } catch (error) {
      console.error('Error fetching watch alerts:', error);
      return [];
    }
  }

  async markAlertAsRead(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('watch_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }
  }
}

export const watchedWalletsService = new WatchedWalletsService();
