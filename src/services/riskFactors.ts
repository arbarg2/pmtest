
import { supabase } from '@/integrations/supabase/client';

export interface RiskFactor {
  id: string;
  factor_type: string;
  severity: 'low' | 'medium' | 'high';
  score: number;
  description: string;
  detected_at: string;
}

export interface SanctionsMatch {
  id: string;
  entity_name: string;
  entity_type: string;
  match_type: 'direct' | '1-hop';
  confidence_score: number;
  source_list: string;
  screening_date: string;
}

class RiskFactorsService {
  async calculateAndStoreRiskFactors(recordId: string, walletData: any): Promise<RiskFactor[]> {
    try {
      // Call the database function to calculate risk factors
      const { data: factors, error } = await supabase.rpc('calculate_risk_factors', {
        wallet_data: walletData
      });

      if (error) throw error;

      // Store the calculated risk factors
      if (factors && factors.length > 0) {
        const riskFactorsToInsert = factors.map((factor: any) => ({
          lookup_record_id: recordId,
          factor_type: factor.factor_type,
          severity: factor.severity,
          score: factor.score,
          description: factor.description
        }));

        const { data: storedFactors, error: insertError } = await supabase
          .from('risk_factors')
          .insert(riskFactorsToInsert)
          .select();

        if (insertError) throw insertError;
        return storedFactors || [];
      }

      return [];
    } catch (error) {
      console.error('Error calculating risk factors:', error);
      return [];
    }
  }

  async getRiskFactors(recordId: string): Promise<RiskFactor[]> {
    try {
      const { data, error } = await supabase
        .from('risk_factors')
        .select('*')
        .eq('lookup_record_id', recordId)
        .order('score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching risk factors:', error);
      return [];
    }
  }

  async screenSanctions(walletAddress: string, network: string = 'BTC'): Promise<SanctionsMatch[]> {
    try {
      const { data: matches, error } = await supabase.rpc('screen_sanctions', {
        wallet_address: walletAddress,
        network: network.toLowerCase()
      });

      if (error) throw error;
      return matches || [];
    } catch (error) {
      console.error('Error screening sanctions:', error);
      return [];
    }
  }

  async storeSanctionsScreening(recordId: string, matches: any[]): Promise<void> {
    try {
      if (matches.length === 0) return;

      const sanctionsToInsert = matches.map(match => ({
        lookup_record_id: recordId,
        entity_name: match.entity_name,
        entity_type: match.entity_type,
        match_type: match.match_type,
        confidence_score: match.confidence_score,
        source_list: match.source_list
      }));

      const { error } = await supabase
        .from('sanctions_screening')
        .insert(sanctionsToInsert);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing sanctions screening:', error);
    }
  }

  async getSanctionsScreening(recordId: string): Promise<SanctionsMatch[]> {
    try {
      const { data, error } = await supabase
        .from('sanctions_screening')
        .select('*')
        .eq('lookup_record_id', recordId)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sanctions screening:', error);
      return [];
    }
  }
}

export const riskFactorsService = new RiskFactorsService();
