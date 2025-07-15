
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
  
  // Add retry logic with exponential backoff
  const maxRetries = 3;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database storage attempt ${attempt}/${maxRetries}`);
      
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
        console.log(`✅ Database storage successful on attempt ${attempt}`);
        return dbResult;
      } else {
        lastError = dbResult.error;
        console.error(`❌ Database storage failed on attempt ${attempt}:`, dbResult.error);
        
        // If it's a duplicate key error, don't retry
        if (typeof dbResult.error === 'string' && dbResult.error.includes('duplicate key')) {
          console.log('Duplicate key error detected, not retrying');
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Database storage error on attempt ${attempt}:`, error);
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All attempts failed
  console.error('❌ All database storage attempts failed:', lastError);
  return { 
    success: false, 
    error: lastError instanceof Error ? lastError.message : String(lastError)
  };
};

export const processRiskFactorsInBackground = async (
  recordId: string,
  result: WalletRiskResponse,
  address: string,
  network: string
) => {
  try {
    console.log('Calculating risk factors for record:', recordId);
    await Promise.race([
      riskFactorsService.calculateAndStoreRiskFactors(recordId, result),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Risk factors timeout')), 10000))
    ]);
    
    // Enhanced sanctions screening
    console.log('🔍 Performing enhanced sanctions screening...');
    let sanctionsResults: any[] = [];
    
    if (result.entity_attribution?.name) {
      sanctionsResults = await Promise.race([
        riskFactorsService.screenEntityByName(result.entity_attribution.name, address),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sanctions timeout')), 10000))
      ]) as any[];
    } else {
      sanctionsResults = await Promise.race([
        riskFactorsService.screenSanctions(address, network),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sanctions timeout')), 10000))
      ]) as any[];
    }
    
    if (sanctionsResults.length > 0) {
      console.log(`⚠️ Found ${sanctionsResults.length} sanctions matches, storing in database...`);
      await riskFactorsService.storeSanctionsScreening(recordId, sanctionsResults);
    } else {
      console.log('✅ No sanctions matches found');
    }
  } catch (error) {
    console.error('Error calculating risk factors or sanctions screening:', error);
    // Don't fail the main analysis if background tasks fail
  }
};
