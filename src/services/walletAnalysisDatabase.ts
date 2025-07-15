import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { riskFactorsService } from '@/services/riskFactors';
import { WalletRiskResponse } from '@/services/api';

export const storeAnalysisResult = async (
  address: string,
  network: string,
  result: WalletRiskResponse,
  userId: string
) => {
  console.log(`Creating database record for ${address} with network: ${network}, user: ${userId}`);
  
  try {
    const dbResult = await supabaseLookupRecords.createLookupRecord({
      wallet_address: address,
      network: network,
      risk_score: result.risk_score || 0,
      risk_level: result.risk_level || 'Low',
      processing_time_ms: result.processing_time_ms || 0,
      risk_assessment: {
        risk_score: result.risk_score || 0,
        risk_level: result.risk_level || 'Low',
        risk_factors: result.risk_factors || {},
        explanation: result.explanation || '',
        entity_attribution: result.entity_attribution || null,
        volume_metrics: result.volume_metrics || null,
        geographic_risk: result.geographic_risk || null,
        sanctions_exposure: result.sanctions_exposure || null,
        top_counterparties: result.top_counterparties || [],
        temporal_patterns: result.temporal_patterns || null,
        behavioral_classification: result.behavioral_classification || null,
        transaction_count: result.transaction_count || 0,
        last_activity: result.last_activity || null,
        processing_time_ms: result.processing_time_ms || 0,
        full_wallet_data: result
      },
      analyst_fields: {
        case_notes: '',
        analyst_decision: 'pending',
        tags: [],
        attachments: []
      }
    }, userId);

    if (dbResult.success) {
      console.log(`✅ Database storage successful`);
      return dbResult;
    } else {
      console.error(`❌ Database storage failed:`, dbResult.error);
      return dbResult;
    }
  } catch (error) {
    console.error(`❌ Database storage error:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const processRiskFactorsInBackground = async (
  recordId: string,
  result: WalletRiskResponse,
  address: string,
  network: string
) => {
  try {
    console.log('Processing risk factors in background for record:', recordId);
    // This would be called in background if needed
    // For now, keep it simple to avoid performance issues
  } catch (error) {
    console.error('Error in background processing:', error);
  }
};
