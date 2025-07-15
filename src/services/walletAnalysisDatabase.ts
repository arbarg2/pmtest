
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
  
  // Add retry logic with exponential backoff for both API and DB issues
  const maxRetries = 5;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database storage attempt ${attempt}/${maxRetries}`);
      
      // Add a small random delay to prevent race conditions
      if (attempt > 1) {
        const baseDelay = Math.pow(2, attempt - 1) * 1000; // 2s, 4s, 8s, 16s
        const jitter = Math.random() * 1000; // Add up to 1s random delay
        const waitTime = baseDelay + jitter;
        console.log(`Waiting ${Math.round(waitTime)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
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
        
        // Check for specific error types
        if (typeof dbResult.error === 'string') {
          // If it's a duplicate key error, try a few more times but don't give up immediately
          if (dbResult.error.includes('duplicate key')) {
            console.log('Duplicate key error detected, will retry with delay');
            if (attempt >= maxRetries) {
              console.log('Max retries reached for duplicate key, giving up');
              break;
            }
            continue;
          }
          
          // If it's a network error, retry
          if (dbResult.error.includes('Failed to fetch') || dbResult.error.includes('network')) {
            console.log('Network error detected, retrying...');
            continue;
          }
        }
        
        // For other errors, still retry but log them
        console.log('Other database error, retrying...');
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Database storage error on attempt ${attempt}:`, error);
      
      // Check if it's a network-related error
      if (error instanceof Error && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('net::ERR_'))) {
        console.log('Network error in catch block, retrying...');
        continue;
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
      new Promise((_, reject) => setTimeout(() => reject(new Error('Risk factors timeout')), 15000))
    ]);
    
    // Enhanced sanctions screening
    console.log('🔍 Performing enhanced sanctions screening...');
    let sanctionsResults: any[] = [];
    
    if (result.entity_attribution?.name) {
      sanctionsResults = await Promise.race([
        riskFactorsService.screenEntityByName(result.entity_attribution.name, address),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sanctions timeout')), 15000))
      ]) as any[];
    } else {
      sanctionsResults = await Promise.race([
        riskFactorsService.screenSanctions(address, network),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sanctions timeout')), 15000))
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
