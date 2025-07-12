
import { supabase } from '@/integrations/supabase/client';
import { WalletRiskResponse } from './api';

export interface RiskFactor {
  id: string;
  lookup_record_id: string;
  factor_type: string;
  severity: 'low' | 'medium' | 'high';
  score: number;
  description?: string;
  detected_at: string;
  created_at: string;
}

export interface SanctionsMatch {
  id: string;
  lookup_record_id: string;
  entity_name: string;
  entity_type: string;
  match_type: 'direct' | '1-hop';
  confidence_score: number;
  source_list: string;
  screening_date: string;
  created_at: string;
}

class RiskFactorsService {
  async getRiskFactors(lookupRecordId: string): Promise<RiskFactor[]> {
    try {
      const { data, error } = await supabase
        .from('risk_factors')
        .select('*')
        .eq('lookup_record_id', lookupRecordId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching risk factors:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRiskFactors:', error);
      return [];
    }
  }

  async calculateAndStoreRiskFactors(lookupRecordId: string, walletData: WalletRiskResponse): Promise<RiskFactor[]> {
    try {
      console.log('Calculating risk factors for lookup record:', lookupRecordId);
      
      // Validate that lookupRecordId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(lookupRecordId)) {
        console.error('Invalid UUID format for lookup record ID:', lookupRecordId);
        return [];
      }

      // Use the database function to calculate risk factors
      const { data: calculatedFactors, error: calcError } = await supabase
        .rpc('calculate_risk_factors', {
          wallet_data: walletData as any
        });

      if (calcError) {
        console.error('Error calculating risk factors:', calcError);
        return [];
      }

      console.log('Calculated risk factors:', calculatedFactors);

      // Store the calculated factors in the database
      const factorsToInsert = calculatedFactors?.map((factor: any) => ({
        lookup_record_id: lookupRecordId,
        factor_type: factor.factor_type,
        severity: factor.severity,
        score: factor.score,
        description: factor.description
      })) || [];

      if (factorsToInsert.length > 0) {
        const { data: insertedFactors, error: insertError } = await supabase
          .from('risk_factors')
          .insert(factorsToInsert)
          .select();

        if (insertError) {
          console.error('Error storing risk factors:', insertError);
          return [];
        }

        console.log('Successfully stored risk factors:', insertedFactors);
        return insertedFactors || [];
      }

      return [];
    } catch (error) {
      console.error('Error calculating risk factors:', error);
      return [];
    }
  }

  async getSanctionsScreening(lookupRecordId: string): Promise<SanctionsMatch[]> {
    try {
      const { data, error } = await supabase
        .from('sanctions_screening')
        .select('*')
        .eq('lookup_record_id', lookupRecordId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sanctions screening:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSanctionsScreening:', error);
      return [];
    }
  }

  async screenSanctions(walletAddress: string, network: string): Promise<SanctionsMatch[]> {
    try {
      console.log('Screening sanctions for:', walletAddress, network);
      
      // Use the database function for sanctions screening
      const { data: screeningResults, error } = await supabase
        .rpc('screen_sanctions', {
          wallet_address: walletAddress,
          network: network
        });

      if (error) {
        console.error('Error screening sanctions:', error);
        return [];
      }

      console.log('Sanctions screening results:', screeningResults);
      return screeningResults || [];
    } catch (error) {
      console.error('Error in screenSanctions:', error);
      return [];
    }
  }

  async storeSanctionsScreening(lookupRecordId: string, matches: any[]): Promise<SanctionsMatch[]> {
    try {
      // Validate that lookupRecordId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(lookupRecordId)) {
        console.error('Invalid UUID format for lookup record ID:', lookupRecordId);
        return [];
      }

      const matchesToInsert = matches.map((match) => ({
        lookup_record_id: lookupRecordId,
        entity_name: match.entity_name,
        entity_type: match.entity_type,
        match_type: match.match_type,
        confidence_score: match.confidence_score,
        source_list: match.source_list
      }));

      const { data: insertedMatches, error } = await supabase
        .from('sanctions_screening')
        .insert(matchesToInsert)
        .select();

      if (error) {
        console.error('Error storing sanctions screening:', error);
        return [];
      }

      return insertedMatches || [];
    } catch (error) {
      console.error('Error in storeSanctionsScreening:', error);
      return [];
    }
  }
}

export const riskFactorsService = new RiskFactorsService();
