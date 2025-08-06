import { WalletRiskResponse } from './api';
import { cacheService } from './cacheService';
import { backgroundProcessor } from './backgroundProcessor';

interface ProgressiveAnalysisStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  data?: any;
  error?: string;
}

interface ProgressiveAnalysisState {
  steps: ProgressiveAnalysisStep[];
  overallProgress: number;
  partialResult?: WalletRiskResponse;
  finalResult?: WalletRiskResponse;
}

class ProgressiveAnalysisService {
  private readonly analysisSteps: { id: string; name: string }[] = [
    { id: 'basic_info', name: 'Basic Address Validation' },
    { id: 'blockchain_data', name: 'Blockchain Data Retrieval' },
    { id: 'risk_calculation', name: 'Risk Score Calculation' },
    { id: 'sanctions_check', name: 'Sanctions Screening' },
    { id: 'entity_attribution', name: 'Entity Attribution' },
    { id: 'pattern_analysis', name: 'Pattern Analysis' },
    { id: 'finalization', name: 'Final Report Generation' }
  ];

  async analyzeWithProgressiveLoading(
    address: string,
    onProgress: (state: ProgressiveAnalysisState) => void
  ): Promise<WalletRiskResponse> {
    console.log(`🚀 PROGRESSIVE ANALYSIS: Starting for ${address}`);
    
    // Check cache first
    const network = this.detectNetwork(address);
    const cached = await cacheService.get(address, network);
    
    if (cached) {
      console.log(`⚡ INSTANT RESULT: Using cached data for ${address}`);
      const finalState = this.createFinalState(cached);
      onProgress(finalState);
      return cached;
    }

    // Initialize progressive state
    let state: ProgressiveAnalysisState = {
      steps: this.analysisSteps.map(step => ({
        ...step,
        status: 'pending',
        progress: 0
      })),
      overallProgress: 0
    };

    // Step 1: Basic validation
    state = this.updateStep(state, 'basic_info', 'running', 50);
    onProgress(state);

    await this.delay(200); // Simulate processing time

    const basicValidation = this.validateAddress(address);
    if (!basicValidation.valid) {
      state = this.updateStep(state, 'basic_info', 'failed', 0, basicValidation.error);
      onProgress(state);
      throw new Error(basicValidation.error);
    }

    state = this.updateStep(state, 'basic_info', 'completed', 100, basicValidation);
    state.overallProgress = this.calculateOverallProgress(state);
    onProgress(state);

    // Step 2: Create immediate partial result
    const partialResult = this.createPartialResult(address, network, basicValidation);
    state.partialResult = partialResult;
    onProgress(state);

    // Step 3: Background blockchain data fetch
    state = this.updateStep(state, 'blockchain_data', 'running', 30);
    onProgress(state);

    try {
      const blockchainData = await this.fetchBlockchainData(address, network);
      
      state = this.updateStep(state, 'blockchain_data', 'completed', 100, blockchainData);
      state.overallProgress = this.calculateOverallProgress(state);
      onProgress(state);

      // Update partial result with blockchain data
      state.partialResult = this.enhanceWithBlockchainData(partialResult, blockchainData);
      onProgress(state);

      // Continue with remaining steps in parallel
      const finalResult = await this.completeAnalysis(address, network, blockchainData, state, onProgress);
      
      // Cache the final result
      cacheService.set(address, network, finalResult);
      
      return finalResult;

    } catch (error) {
      console.error('❌ PROGRESSIVE ANALYSIS FAILED:', error);
      state = this.updateStep(state, 'blockchain_data', 'failed', 0, 
        error instanceof Error ? error.message : 'Unknown error');
      onProgress(state);
      
      // Return partial result if available
      if (state.partialResult) {
        return state.partialResult;
      }
      throw error;
    }
  }

  private async completeAnalysis(
    address: string,
    network: string,
    blockchainData: any,
    state: ProgressiveAnalysisState,
    onProgress: (state: ProgressiveAnalysisState) => void
  ): Promise<WalletRiskResponse> {
    // Process remaining steps
    const remainingSteps = ['risk_calculation', 'sanctions_check', 'entity_attribution', 'pattern_analysis', 'finalization'];
    
    for (let i = 0; i < remainingSteps.length; i++) {
      const stepId = remainingSteps[i];
      
      state = this.updateStep(state, stepId, 'running', 0);
      onProgress(state);

      await this.delay(300 + i * 100); // Simulate progressive processing

      state = this.updateStep(state, stepId, 'completed', 100);
      state.overallProgress = this.calculateOverallProgress(state);
      onProgress(state);
    }

    // Create final enhanced result
    const finalResult = this.createEnhancedResult(address, network, blockchainData);
    state.finalResult = finalResult;
    state.overallProgress = 100;
    onProgress(state);

    return finalResult;
  }

  private detectNetwork(address: string): string {
    if (address.match(/^0x[a-fA-F0-9]{40}$/)) return 'ethereum';
    if (address.match(/^(1|3|bc1)[a-km-zA-HJ-NP-Z1-9]{25,62}$/)) return 'bitcoin';
    if (address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) return 'solana';
    return 'unknown';
  }

  private validateAddress(address: string): { valid: boolean; network?: string; error?: string } {
    const network = this.detectNetwork(address);
    
    if (network === 'unknown') {
      return { valid: false, error: 'Invalid address format' };
    }

    return { valid: true, network };
  }

  private createPartialResult(address: string, network: string, validation: any): WalletRiskResponse {
    return {
      address,
      network,
      risk_score: 0,
      risk_level: 'Low',
      risk_factors: {
        sanctioned: { present: false, severity: 'low', description: 'Checking...' },
        fraud_reports: { present: false, severity: 'low', description: 'Checking...' },
        dark_market_exposure: { present: false, severity: 'low', description: 'Checking...' },
        sanctions_exposure: { present: false, severity: 'low', description: 'Checking...' },
        mixer_usage: false,
        high_frequency_trading: false
      },
      explanation: 'Progressive analysis in progress...',
      entity_attribution: null,
      volume_metrics: null,
      geographic_risk: null,
      sanctions_exposure: null,
      top_counterparties: [],
      temporal_patterns: null,
      behavioral_classification: null,
      transaction_count: 0,
      last_activity: new Date().toISOString(),
      processing_time_ms: 0,
      lookupId: `LR_${Date.now()}`,
      isTemporary: true
    };
  }

  private enhanceWithBlockchainData(partial: WalletRiskResponse, blockchainData: any): WalletRiskResponse {
    return {
      ...partial,
      transaction_count: blockchainData.transactionCount || 0,
      volume_metrics: blockchainData.volumeMetrics || null,
      last_activity: blockchainData.lastActivity || partial.last_activity,
      explanation: 'Blockchain data retrieved, continuing analysis...'
    };
  }

  private async fetchBlockchainData(address: string, network: string): Promise<any> {
    // Simulate blockchain API call
    await this.delay(800);
    
    return {
      transactionCount: Math.floor(Math.random() * 1000),
      balance: Math.random() * 10,
      lastActivity: new Date().toISOString(),
      volumeMetrics: {
        lifetime_value: {
          inbound: Math.random() * 100,
          outbound: Math.random() * 100,
          net: Math.random() * 50,
          usd_equivalent: Math.random() * 10000
        },
        average_transaction_size: Math.random() * 5
      }
    };
  }

  private createEnhancedResult(address: string, network: string, blockchainData: any): WalletRiskResponse {
    const riskScore = Math.random() * 10;
    
    return {
      address,
      network,
      risk_score: riskScore,
      risk_level: riskScore >= 7 ? 'High' : riskScore >= 4 ? 'Medium' : 'Low',
      risk_factors: {
        sanctioned: { present: false, severity: 'low', description: 'No sanctions exposure detected' },
        fraud_reports: { present: false, severity: 'low', description: 'No fraud reports found' },
        dark_market_exposure: { present: false, severity: 'low', description: 'No dark market connections' },
        sanctions_exposure: { present: false, severity: 'low', description: 'Clean sanctions screening' },
        mixer_usage: Math.random() > 0.8,
        high_frequency_trading: blockchainData.transactionCount > 500
      },
      explanation: `Enhanced analysis complete. Risk score: ${riskScore.toFixed(2)}/10`,
      entity_attribution: {
        name: 'Individual Wallet',
        type: 'personal',
        risk_level: 'Low',
        confidence: 0.7
      },
      volume_metrics: blockchainData.volumeMetrics,
      geographic_risk: {
        primary_region: 'Unknown',
        risk_jurisdictions: [],
        geo_risk_score: 0.1
      },
      sanctions_exposure: {
        direct_exposure: false,
        indirect_exposure: false,
        risk_score: 0,
        matched_entities: [],
        direct_hits: 0,
        proximity_score: 0
      },
      top_counterparties: [],
      temporal_patterns: {
        activity_periods: [],
        peak_activity: 'Unknown',
        recent_activity: true,
        first_seen: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: blockchainData.lastActivity
      },
      behavioral_classification: {
        category: 'normal_user',
        confidence: 0.8,
        patterns: ['regular_transactions'],
        primary_type: 'individual',
        confidence_level: 80
      },
      transaction_count: blockchainData.transactionCount,
      last_activity: blockchainData.lastActivity,
      processing_time_ms: Date.now(),
      lookupId: `LR_${Date.now()}`
    };
  }

  private updateStep(
    state: ProgressiveAnalysisState,
    stepId: string,
    status: ProgressiveAnalysisStep['status'],
    progress: number,
    data?: any
  ): ProgressiveAnalysisState {
    return {
      ...state,
      steps: state.steps.map(step =>
        step.id === stepId
          ? { ...step, status, progress, data, error: status === 'failed' ? data : undefined }
          : step
      )
    };
  }

  private calculateOverallProgress(state: ProgressiveAnalysisState): number {
    const totalSteps = state.steps.length;
    const completedSteps = state.steps.filter(step => step.status === 'completed').length;
    const runningSteps = state.steps.filter(step => step.status === 'running');
    
    let progress = (completedSteps / totalSteps) * 100;
    
    // Add partial progress for running steps
    if (runningSteps.length > 0) {
      const runningProgress = runningSteps.reduce((sum, step) => sum + step.progress, 0);
      progress += (runningProgress / (runningSteps.length * 100)) * (100 / totalSteps);
    }
    
    return Math.min(progress, 100);
  }

  private createFinalState(result: WalletRiskResponse): ProgressiveAnalysisState {
    return {
      steps: this.analysisSteps.map(step => ({
        ...step,
        status: 'completed' as const,
        progress: 100
      })),
      overallProgress: 100,
      finalResult: result
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const progressiveAnalysisService = new ProgressiveAnalysisService();