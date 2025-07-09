
// API service for BlockTrace - lightweight, API-first approach
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.blocktrace.dev';

export interface WalletRiskResponse {
  address: string;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  explanation: string;
  risk_factors: {
    sanctioned: boolean;
    fraud_reports: boolean;
    dark_market_exposure: boolean;
    mixer_usage: boolean;
    high_frequency_trading: boolean;
  };
  last_activity: string;
  transaction_count: number;
  network: 'BTC' | 'ETH';
  processing_time_ms: number;
}

export interface TransactionGraphResponse {
  nodes: Array<{
    id: string;
    type: 'wallet' | 'exchange' | 'mixer' | 'unknown';
    risk_level: 'Low' | 'Medium' | 'High';
    label?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    value: number;
    timestamp: string;
  }>;
  summary: {
    total_value: number;
    hop_count: number;
    risk_nodes: number;
  };
}

class BlockTraceAPI {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Core wallet risk scoring - lightweight, real-time
  async analyzeWallet(address: string): Promise<WalletRiskResponse> {
    // For demo purposes, we'll simulate the API response
    // In production, this would call the real API
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const mockResponse: WalletRiskResponse = {
      address,
      risk_score: Math.random() * 10,
      risk_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as any,
      explanation: this.generateExplanation(),
      risk_factors: {
        sanctioned: Math.random() > 0.85,
        fraud_reports: Math.random() > 0.9,
        dark_market_exposure: Math.random() > 0.7,
        mixer_usage: Math.random() > 0.8,
        high_frequency_trading: Math.random() > 0.6,
      },
      last_activity: new Date().toISOString().split('T')[0],
      transaction_count: Math.floor(Math.random() * 1000) + 10,
      network: address.length > 35 ? 'ETH' : 'BTC',
      processing_time_ms: Math.floor(Math.random() * 500) + 200,
    };

    return mockResponse;
  }

  // On-demand transaction graph (1-3 hops max for cost efficiency)
  async getTransactionGraph(address: string, maxHops: number = 2): Promise<TransactionGraphResponse> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Generate lightweight graph data
    const nodeCount = Math.min(15, maxHops * 5);
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: `addr_${i}`,
      type: ['wallet', 'exchange', 'mixer', 'unknown'][Math.floor(Math.random() * 4)] as any,
      risk_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as any,
      label: i === 0 ? 'Target' : undefined,
    }));

    const edges = Array.from({ length: nodeCount - 1 }, (_, i) => ({
      source: i === 0 ? nodes[0].id : nodes[Math.floor(Math.random() * i)].id,
      target: nodes[i + 1].id,
      value: Math.random() * 10,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    return {
      nodes,
      edges,
      summary: {
        total_value: edges.reduce((sum, edge) => sum + edge.value, 0),
        hop_count: maxHops,
        risk_nodes: nodes.filter(n => n.risk_level === 'High').length,
      },
    };
  }

  // Generate compliance report
  async generateReport(address: string, format: 'pdf' | 'json' = 'pdf'): Promise<Blob | object> {
    const walletData = await this.analyzeWallet(address);
    
    if (format === 'json') {
      return {
        report_id: `RPT_${Date.now()}`,
        generated_at: new Date().toISOString(),
        wallet_analysis: walletData,
        compliance_summary: {
          aml_status: walletData.risk_level === 'High' ? 'REQUIRES_REVIEW' : 'APPROVED',
          sanctions_check: walletData.risk_factors.sanctioned ? 'FLAGGED' : 'CLEAR',
          recommendation: this.getComplianceRecommendation(walletData.risk_level),
        },
      };
    }

    // For PDF, return a simple text blob for now
    const reportText = this.generateReportText(walletData);
    return new Blob([reportText], { type: 'application/pdf' });
  }

  private generateExplanation(): string {
    const explanations = [
      'This wallet shows normal transaction patterns with reputable counterparties and no red flags.',
      'This wallet has some exposure to higher-risk entities but maintains mostly legitimate activity.',
      'This wallet shows concerning patterns including potential connections to high-risk addresses.',
    ];
    return explanations[Math.floor(Math.random() * explanations.length)];
  }

  private getComplianceRecommendation(riskLevel: string): string {
    switch (riskLevel) {
      case 'Low': return 'PROCEED - Standard processing approved';
      case 'Medium': return 'ENHANCED_DUE_DILIGENCE - Additional verification recommended';
      case 'High': return 'BLOCK - Manual review required before processing';
      default: return 'REVIEW - Unable to determine risk level';
    }
  }

  private generateReportText(data: WalletRiskResponse): string {
    return `
BLOCKTRACE COMPLIANCE REPORT
Generated: ${new Date().toISOString()}

WALLET ANALYSIS
Address: ${data.address}
Network: ${data.network}
Risk Level: ${data.risk_level}
Risk Score: ${data.risk_score.toFixed(1)}/10

RISK FACTORS
- Sanctioned Entity: ${data.risk_factors.sanctioned ? 'FLAGGED' : 'CLEAR'}
- Fraud Reports: ${data.risk_factors.fraud_reports ? 'FLAGGED' : 'CLEAR'}
- Dark Market Exposure: ${data.risk_factors.dark_market_exposure ? 'FLAGGED' : 'CLEAR'}
- Mixer Usage: ${data.risk_factors.mixer_usage ? 'FLAGGED' : 'CLEAR'}

EXPLANATION
${data.explanation}

RECOMMENDATION
${this.getComplianceRecommendation(data.risk_level)}

Processing Time: ${data.processing_time_ms}ms
Report ID: RPT_${Date.now()}
    `.trim();
  }
}

export const blockTraceAPI = new BlockTraceAPI();
