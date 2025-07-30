
// Free blockchain data integration service
interface BitcoinAddressInfo {
  address: string;
  balance: number;
  txs: number;
  received: number;
  sent: number;
}

interface EthereumAddressInfo {
  address: string;
  balance: string;
  txCount: number;
}

interface Transaction {
  hash: string;
  value: number;
  timestamp: number;
  from?: string;
  to?: string;
}

class BlockchainDataService {
  private readonly BITCOIN_API_BASE = 'https://blockstream.info/api';
  private readonly ETHEREUM_API_BASE = 'https://api.etherscan.io/api';
  private readonly ETHERSCAN_API_KEY = 'YourApiKey'; // Free tier available

  // Bitcoin data using Blockstream API (completely free)
  async getBitcoinAddressInfo(address: string): Promise<BitcoinAddressInfo> {
    try {
      const response = await fetch(`${this.BITCOIN_API_BASE}/address/${address}`);
      if (!response.ok) throw new Error('Bitcoin API error');
      
      const data = await response.json();
      return {
        address,
        balance: data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum,
        txs: data.chain_stats.tx_count,
        received: data.chain_stats.funded_txo_sum,
        sent: data.chain_stats.spent_txo_sum,
      };
    } catch (error) {
      console.error('Bitcoin API error:', error);
      throw new Error('Failed to fetch Bitcoin address data');
    }
  }

  async getBitcoinTransactions(address: string, limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.BITCOIN_API_BASE}/address/${address}/txs`);
      if (!response.ok) throw new Error('Bitcoin transactions API error');
      
      const txs = await response.json();
      return txs.slice(0, limit).map((tx: any) => ({
        hash: tx.txid,
        value: tx.vout.reduce((sum: number, out: any) => sum + out.value, 0) / 100000000, // Convert satoshis to BTC
        timestamp: tx.status.block_time,
        from: tx.vin[0]?.prevout?.scriptpubkey_address || 'Unknown',
        to: tx.vout[0]?.scriptpubkey_address || 'Unknown',
      }));
    } catch (error) {
      console.error('Bitcoin transactions error:', error);
      return [];
    }
  }

  // Ethereum data using Etherscan API (free tier)
  async getEthereumAddressInfo(address: string): Promise<EthereumAddressInfo> {
    try {
      const balanceResponse = await fetch(
        `${this.ETHEREUM_API_BASE}?module=account&action=balance&address=${address}&tag=latest&apikey=${this.ETHERSCAN_API_KEY}`
      );
      const txCountResponse = await fetch(
        `${this.ETHEREUM_API_BASE}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${this.ETHERSCAN_API_KEY}`
      );

      const balanceData = await balanceResponse.json();
      const txCountData = await txCountResponse.json();

      return {
        address,
        balance: balanceData.result || '0',
        txCount: parseInt(txCountData.result || '0', 16),
      };
    } catch (error) {
      console.error('Ethereum API error:', error);
      throw new Error('Failed to fetch Ethereum address data');
    }
  }

  async getEthereumTransactions(address: string, limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await fetch(
        `${this.ETHEREUM_API_BASE}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${this.ETHERSCAN_API_KEY}`
      );
      
      const data = await response.json();
      if (data.status !== '1') return [];

      return data.result.slice(0, limit).map((tx: any) => ({
        hash: tx.hash,
        value: parseFloat(tx.value) / 1e18, // Convert wei to ETH
        timestamp: parseInt(tx.timeStamp),
        from: tx.from,
        to: tx.to,
      }));
    } catch (error) {
      console.error('Ethereum transactions error:', error);
      return [];
    }
  }

  // Risk scoring based on transaction patterns (heuristic analysis)
  calculateRiskScore(addressInfo: any, transactions: Transaction[]): {
    score: number;
    level: 'Low' | 'Medium' | 'High';
    factors: Record<string, boolean>;
  } {
    let riskScore = 0;
    const factors = {
      high_volume: false,
      many_transactions: false,
      recent_activity: false,
      suspicious_patterns: false,
      mixer_usage: false,
    };

    // High volume transactions
    const totalValue = transactions.reduce((sum, tx) => sum + tx.value, 0);
    if (totalValue > 100) {
      riskScore += 2;
      factors.high_volume = true;
    }

    // Many transactions (potential automated activity)
    if (transactions.length > 50 || (addressInfo.txs && addressInfo.txs > 100)) {
      riskScore += 1;
      factors.many_transactions = true;
    }

    // Recent activity
    const recentTx = transactions.find(tx => Date.now() - tx.timestamp * 1000 < 24 * 60 * 60 * 1000);
    if (recentTx) {
      factors.recent_activity = true;
    }

    // Simple pattern detection (many small transactions could indicate mixing)
    const smallTxCount = transactions.filter(tx => tx.value < 0.1).length;
    if (smallTxCount > transactions.length * 0.8 && transactions.length > 10) {
      riskScore += 3;
      factors.suspicious_patterns = true;
      factors.mixer_usage = true;
    }

    // Determine risk level
    let level: 'Low' | 'Medium' | 'High';
    if (riskScore >= 4) level = 'High';
    else if (riskScore >= 2) level = 'Medium';
    else level = 'Low';

    return { score: Math.min(riskScore, 10), level, factors };
  }

  // Detect network type from address format
  detectNetwork(address: string): 'BTC' | 'ETH' | 'SOL' {
    // Bitcoin addresses start with 1, 3, or bc1
    if (address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || address.startsWith('bc1')) {
      return 'BTC';
    }
    // Ethereum addresses are 42 characters starting with 0x
    if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return 'ETH';
    }
    // Solana addresses are 32-44 characters, Base58 encoded
    if (address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
      return 'SOL';
    }
    // Default to Bitcoin for unknown formats
    return 'BTC';
  }
}

export const blockchainDataService = new BlockchainDataService();
