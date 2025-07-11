import { LookupRecord, LookupRecordFilters } from '@/types/lookupRecords';
import { WalletRiskResponse } from './api';

class LookupRecordService {
  private records: LookupRecord[] = [];

  // Generate AI compliance summary
  private generateComplianceSummary(walletData: WalletRiskResponse): LookupRecord['compliance_summary'] {
    const riskFactors = Object.entries(walletData.risk_factors)
      .filter(([_, value]) => value)
      .map(([key, _]) => key.replace(/_/g, ' '));

    let explanation = '';
    let regulatoryRelevance: string[] = [];
    let suggestedAction: LookupRecord['compliance_summary']['suggested_action'] = 'allow';

    switch (walletData.risk_level) {
      case 'Low':
        explanation = `This wallet demonstrates normal transaction patterns with minimal risk indicators. The address appears to engage primarily with reputable counterparties and shows no significant red flags that would raise compliance concerns.`;
        suggestedAction = 'allow';
        break;
      case 'Medium':
        explanation = `This wallet shows moderate risk indicators that warrant additional scrutiny. While not immediately concerning, the transaction patterns or counterparty associations suggest enhanced due diligence may be appropriate.`;
        regulatoryRelevance = ['Enhanced Due Diligence Required'];
        suggestedAction = 'manual_review';
        break;
      case 'High':
        explanation = `This wallet exhibits significant risk indicators including potential connections to high-risk entities or suspicious activity patterns. Immediate review and potential blocking recommended pending further investigation.`;
        regulatoryRelevance = ['AML Compliance Review', 'Suspicious Activity'];
        suggestedAction = 'escalation';
        break;
    }

    if (walletData.risk_factors.sanctioned) {
      regulatoryRelevance.push('OFAC Sanctions Screening');
      suggestedAction = 'block';
      explanation += ' WARNING: Potential sanctions exposure detected.';
    }

    if (walletData.risk_factors.fraud_reports) {
      regulatoryRelevance.push('Fraud Prevention');
    }

    if (walletData.risk_factors.mixer_usage) {
      regulatoryRelevance.push('Privacy Coin/Mixer Activity');
    }

    return {
      explanation,
      regulatory_relevance: regulatoryRelevance,
      suggested_action: suggestedAction,
      confidence_level: Math.min(0.95, 0.6 + (walletData.risk_score / 10) * 0.35)
    };
  }

  // Generate mock transaction data
  private generateRecentTransactions(network: string, riskLevel: string) {
    const transactionCount = Math.floor(Math.random() * 5) + 3;
    return Array.from({ length: transactionCount }, (_, i) => ({
      direction: (Math.random() > 0.5 ? 'inbound' : 'outbound') as 'inbound' | 'outbound',
      amount: Math.random() * 100,
      risk_score: riskLevel === 'High' ? Math.random() * 4 + 6 : Math.random() * 6,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  // Create a new lookup record
  async createLookupRecord(walletData: WalletRiskResponse): Promise<LookupRecord> {
    const recentTransactions = this.generateRecentTransactions(walletData.network, walletData.risk_level);
    const totalInbound = recentTransactions
      .filter(tx => tx.direction === 'inbound')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalOutbound = recentTransactions
      .filter(tx => tx.direction === 'outbound')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const record: LookupRecord = {
      id: `LR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      wallet_address: walletData.address,
      network: walletData.network,
      
      risk_assessment: {
        risk_score: walletData.risk_score,
        risk_level: walletData.risk_level as any,
        key_risk_factors: Object.entries(walletData.risk_factors)
          .filter(([_, value]) => value)
          .map(([key, _]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
        recent_transactions: recentTransactions,
        flow_analysis: {
          total_inbound: totalInbound,
          total_outbound: totalOutbound,
          net_flow: totalInbound - totalOutbound
        }
      },
      
      compliance_summary: this.generateComplianceSummary(walletData),
      
      analyst_fields: {
        case_notes: '',
        analyst_decision: 'pending',
        tags: [],
        attachments: []
      },
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processing_time_ms: walletData.processing_time_ms
    };

    this.records.unshift(record);
    return record;
  }

  // Update an existing lookup record
  async updateLookupRecord(id: string, updates: Partial<LookupRecord['analyst_fields']>): Promise<LookupRecord | null> {
    const recordIndex = this.records.findIndex(record => record.id === id);
    if (recordIndex === -1) {
      console.warn(`Lookup record with ID ${id} not found`);
      return null;
    }

    const currentRecord = this.records[recordIndex];
    
    this.records[recordIndex] = {
      ...currentRecord,
      analyst_fields: {
        ...currentRecord.analyst_fields,
        ...updates,
        ...(updates.analyst_decision && updates.analyst_decision !== currentRecord.analyst_fields.analyst_decision && {
          reviewed_at: new Date().toISOString(),
          analyst_name: 'Current User' // In production, get from auth context
        })
      },
      updated_at: new Date().toISOString()
    };

    console.log(`Updated lookup record ${id}:`, this.records[recordIndex]);
    return this.records[recordIndex];
  }

  // Get all lookup records with optional filtering
  async getLookupRecords(filters?: LookupRecordFilters): Promise<LookupRecord[]> {
    let filteredRecords = [...this.records];

    if (filters?.risk_level?.length) {
      filteredRecords = filteredRecords.filter(record => 
        filters.risk_level!.includes(record.risk_assessment.risk_level)
      );
    }

    if (filters?.analyst_decision?.length) {
      filteredRecords = filteredRecords.filter(record => 
        filters.analyst_decision!.includes(record.analyst_fields.analyst_decision)
      );
    }

    if (filters?.tags?.length) {
      filteredRecords = filteredRecords.filter(record => 
        filters.tags!.some(tag => record.analyst_fields.tags.includes(tag))
      );
    }

    if (filters?.search_term) {
      const searchTerm = filters.search_term.toLowerCase();
      filteredRecords = filteredRecords.filter(record => 
        record.wallet_address.toLowerCase().includes(searchTerm) ||
        record.analyst_fields.case_notes.toLowerCase().includes(searchTerm) ||
        record.compliance_summary.explanation.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.date_range) {
      const start = new Date(filters.date_range.start);
      const end = new Date(filters.date_range.end);
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= start && recordDate <= end;
      });
    }

    return filteredRecords;
  }

  // Get a single lookup record by ID
  async getLookupRecord(id: string): Promise<LookupRecord | null> {
    return this.records.find(record => record.id === id) || null;
  }

  // Get lookup statistics
  async getLookupStats() {
    const total = this.records.length;
    const riskLevelCounts = this.records.reduce((acc, record) => {
      acc[record.risk_assessment.risk_level] = (acc[record.risk_assessment.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const decisionCounts = this.records.reduce((acc, record) => {
      acc[record.analyst_fields.analyst_decision] = (acc[record.analyst_fields.analyst_decision] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      risk_level_breakdown: riskLevelCounts,
      decision_breakdown: decisionCounts,
      pending_review: decisionCounts.pending || 0
    };
  }
}

export const lookupRecordService = new LookupRecordService();
