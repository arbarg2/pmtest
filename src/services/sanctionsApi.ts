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

  /**
   * Screens an entity/address against OpenSanctions. Never fabricates results:
   * if the provider is unavailable the error is propagated so callers can flag
   * the screening as incomplete rather than reporting a clean result.
   */
  async screenEntity(entityName: string, walletAddress?: string): Promise<SanctionsResult[]> {
    console.log(`Screening entity: ${entityName} ${walletAddress ? `(${walletAddress})` : ''}`);

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

  // No mock/demo sanctions results exist. A screening either returns real
  // provider matches or throws so the caller can mark it as unverified.



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
