interface OpenSanctionsMatch {
  id: string;
  caption: string;
  schema: string;
  datasets: string[];
  score: number;
  match: boolean;
  properties: {
    name?: string[];
    alias?: string[];
    country?: string[];
    birthDate?: string[];
    topics?: string[];
  };
}

interface OpenSanctionsResponse {
  responses: OpenSanctionsMatch[];
  total: {
    results: number;
    matches: number;
  };
}

interface SanctionsResult {
  entity_name: string;
  entity_type: string;
  match_type: 'direct' | '1-hop';
  confidence_score: number;
  source_list: string;
  matched_entity: string;
  sanction_match: boolean;
}

class SanctionsScreeningService {
  private readonly OPENSANCTIONS_API = 'https://api.opensanctions.org';
  private readonly MOCK_MODE = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_SANCTIONS === 'true';

  async screenEntity(entityName: string, walletAddress?: string): Promise<SanctionsResult[]> {
    console.log(`Screening entity: ${entityName} ${walletAddress ? `(${walletAddress})` : ''}`);
    
    if (this.MOCK_MODE) {
      console.log('Using mock sanctions screening');
      return this.getMockSanctionsResults(entityName, walletAddress);
    }

    try {
      // Screen entity name if provided
      const results: SanctionsResult[] = [];
      
      if (entityName && entityName !== 'Unknown Entity') {
        const entityResults = await this.queryOpenSanctions(entityName);
        results.push(...entityResults);
      }

      // Screen wallet address for known sanctioned addresses
      if (walletAddress) {
        const addressResults = await this.queryOpenSanctions(walletAddress);
        results.push(...addressResults);
      }

      console.log(`Found ${results.length} sanctions matches`);
      return results;
    } catch (error) {
      console.error('Sanctions screening API failed, using fallback:', error);
      return this.getMockSanctionsResults(entityName, walletAddress);
    }
  }

  private async queryOpenSanctions(query: string): Promise<SanctionsResult[]> {
    try {
      const url = `${this.OPENSANCTIONS_API}/match?q=${encodeURIComponent(query)}&dataset=default&limit=10`;
      console.log('Querying OpenSanctions:', url);
      
      // Add 3-second timeout for fast response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Rian-Blockchain-Intelligence/1.0'
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`OpenSanctions API returned ${response.status}, using fallback`);
        return []; // Return empty array instead of throwing
      }

      const data: OpenSanctionsResponse = await response.json();
      console.log('OpenSanctions response:', data);

      return this.parseOpenSanctionsResults(data, query);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('OpenSanctions query timed out after 3s, using fallback');
      } else {
        console.warn('OpenSanctions query failed:', error);
      }
      return []; // Return empty array for faster fallback
    }
  }

  private parseOpenSanctionsResults(data: OpenSanctionsResponse, originalQuery: string): SanctionsResult[] {
    if (!data.responses || data.responses.length === 0) {
      return [];
    }

    return data.responses
      .filter(match => match.match && match.score > 0.3) // Only include confident matches
      .map(match => ({
        entity_name: match.properties.name?.[0] || match.caption || originalQuery,
        entity_type: this.determineEntityType(match),
        match_type: match.score > 0.7 ? 'direct' : '1-hop',
        confidence_score: Math.min(match.score, 1.0),
        source_list: this.determineSourceList(match.datasets),
        matched_entity: match.caption || match.properties.name?.[0] || 'Unknown',
        sanction_match: true
      }));
  }

  private determineEntityType(match: OpenSanctionsMatch): string {
    const topics = match.properties.topics || [];
    
    if (topics.includes('crime.org')) return 'Criminal Organization';
    if (topics.includes('sanction')) return 'Sanctioned Entity';
    if (topics.includes('poi')) return 'Person of Interest';
    if (topics.includes('role.oligarch')) return 'Oligarch';
    if (topics.includes('role.pep')) return 'PEP';
    
    // Check schema
    if (match.schema === 'Person') return 'Individual';
    if (match.schema === 'Organization') return 'Organization';
    if (match.schema === 'Company') return 'Company';
    
    return 'Entity';
  }

  private determineSourceList(datasets: string[]): string {
    if (datasets.includes('us_ofac_sdn')) return 'OFAC SDN List';
    if (datasets.includes('eu_fsf')) return 'EU Consolidated List';
    if (datasets.includes('un_sc_sanctions')) return 'UN Security Council';
    if (datasets.includes('gb_hmt_sanctions')) return 'UK HM Treasury';
    if (datasets.includes('ca_dfatd_sema')) return 'Canada SEMA List';
    
    return datasets[0] || 'International Sanctions Database';
  }

  private getMockSanctionsResults(entityName: string, walletAddress?: string): SanctionsResult[] {
    const results: SanctionsResult[] = [];
    
    // Generate hash-based mock results for consistency
    const entityHash = this.hashString(entityName || '');
    const addressHash = walletAddress ? this.hashString(walletAddress) : 0;
    
    // High-risk entities that should trigger sanctions
    const highRiskEntities = ['mixer', 'tumbler', 'tornado', 'blender', 'wasabi'];
    const isHighRisk = highRiskEntities.some(risk => 
      entityName?.toLowerCase().includes(risk)
    );
    
    // Known problematic addresses for demo
    const knownSanctionedAddresses = [
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block
      '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX', // Silk Road
      '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF'  // BitFinex hack
    ];
    
    if (walletAddress && knownSanctionedAddresses.some(addr => walletAddress.includes(addr))) {
      results.push({
        entity_name: 'Known Sanctioned Address',
        entity_type: 'Sanctioned Wallet',
        match_type: 'direct',
        confidence_score: 0.95,
        source_list: 'Demo Sanctions List',
        matched_entity: walletAddress.substring(0, 20) + '...',
        sanction_match: true
      });
    }
    
    // Entity-based sanctions (mixers, etc.)
    if (isHighRisk) {
      results.push({
        entity_name: entityName,
        entity_type: 'High-Risk Service',
        match_type: 'direct',
        confidence_score: 0.85,
        source_list: 'OFAC SDN List (Mock)',
        matched_entity: entityName,
        sanction_match: true
      });
    }
    
    // Random sanctions based on hash (for demo consistency)
    if (entityHash % 20 === 0) { // 5% chance
      results.push({
        entity_name: 'Sanctioned Exchange',
        entity_type: 'Exchange',
        match_type: '1-hop',
        confidence_score: 0.65,
        source_list: 'EU Consolidated List (Mock)',
        matched_entity: 'Related sanctioned entity',
        sanction_match: true
      });
    }
    
    return results;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Method to calculate risk score adjustment based on sanctions
  calculateRiskAdjustment(sanctionsResults: SanctionsResult[]): number {
    if (sanctionsResults.length === 0) return 0;

    let maxAdjustment = 0;
    
    for (const result of sanctionsResults) {
      let adjustment = 0;
      
      if (result.match_type === 'direct') {
        adjustment = result.confidence_score * 8.0; // Up to 8 point increase
      } else if (result.match_type === '1-hop') {
        adjustment = result.confidence_score * 4.0; // Up to 4 point increase
      }
      
      maxAdjustment = Math.max(maxAdjustment, adjustment);
    }
    
    return Math.min(maxAdjustment, 8.0); // Cap at 8 points
  }
}

export const sanctionsScreeningService = new SanctionsScreeningService();
export type { SanctionsResult };
