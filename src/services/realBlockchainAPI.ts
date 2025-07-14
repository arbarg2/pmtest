
import { supabase } from '@/integrations/supabase/client';

// Real-time blockchain API integration service
interface EtherscanResponse {
  status: string;
  message: string;
  result: any;
}

interface BlockstreamAddressInfo {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

interface BlockstreamTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout?: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address?: string;
      value: number;
    };
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface EthereumTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
}

class RealBlockchainAPI {
  private readonly ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';
  private readonly BLOCKSTREAM_BASE_URL = 'https://blockstream.info/api';
  private etherscanApiKey: string | null = null;

  constructor() {
    this.initializeApiKey();
  }

  private async initializeApiKey() {
    try {
      // Get API key from Supabase Edge Function secrets
      const { data, error } = await supabase.functions.invoke('get-api-keys');
      if (data?.etherscanApiKey) {
        this.etherscanApiKey = data.etherscanApiKey;
        console.log('✅ Etherscan API key loaded from secrets');
      } else {
        console.warn('⚠️ Etherscan API key not found in secrets');
      }
    } catch (error) {
      console.warn('⚠️ Could not load API keys from secrets:', error);
    }
  }

  // Bitcoin API integration using Blockstream (free, no API key needed)
  async getBitcoinAddressData(address: string): Promise<{
    balance: number;
    totalReceived: number;
    totalSent: number;
    transactionCount: number;
    transactions: any[];
  }> {
    try {
      console.log(`🔍 [BITCOIN] Fetching real data for address: ${address}`);
      
      // Get address info from Blockstream API
      const addressResponse = await fetch(`${this.BLOCKSTREAM_BASE_URL}/address/${address}`);
      if (!addressResponse.ok) {
        throw new Error(`Blockstream API error: ${addressResponse.status} - ${addressResponse.statusText}`);
      }
      
      const addressInfo: BlockstreamAddressInfo = await addressResponse.json();
      
      // Get transactions from Blockstream API
      const txResponse = await fetch(`${this.BLOCKSTREAM_BASE_URL}/address/${address}/txs`);
      const transactions: BlockstreamTransaction[] = txResponse.ok ? await txResponse.json() : [];
      
      const totalStats = {
        funded: addressInfo.chain_stats.funded_txo_sum + addressInfo.mempool_stats.funded_txo_sum,
        spent: addressInfo.chain_stats.spent_txo_sum + addressInfo.mempool_stats.spent_txo_sum,
        txCount: addressInfo.chain_stats.tx_count + addressInfo.mempool_stats.tx_count
      };

      const result = {
        balance: (totalStats.funded - totalStats.spent) / 100000000, // Convert satoshis to BTC
        totalReceived: totalStats.funded / 100000000,
        totalSent: totalStats.spent / 100000000,
        transactionCount: totalStats.txCount,
        transactions: transactions.slice(0, 50) // Latest 50 transactions
      };

      console.log(`✅ [BITCOIN] Successfully fetched real data:`, result);
      return result;
    } catch (error) {
      console.error('❌ [BITCOIN] API error:', error);
      throw new Error(`Failed to fetch Bitcoin address data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Ethereum API integration using Etherscan
  async getEthereumAddressData(address: string): Promise<{
    balance: number;
    transactionCount: number;
    transactions: EthereumTransaction[];
    tokenTransfers: any[];
  }> {
    // Initialize API key if not already done
    if (!this.etherscanApiKey) {
      await this.initializeApiKey();
    }

    if (!this.etherscanApiKey) {
      throw new Error('Etherscan API key not configured. Please add your API key in the project settings.');
    }

    try {
      console.log(`🔍 [ETHEREUM] Fetching real data for address: ${address}`);
      
      // Get ETH balance
      const balanceResponse = await fetch(
        `${this.ETHERSCAN_BASE_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${this.etherscanApiKey}`
      );
      const balanceData: EtherscanResponse = await balanceResponse.json();
      
      if (balanceData.status !== '1') {
        throw new Error(`Etherscan balance API error: ${balanceData.message}`);
      }

      // Get transaction history
      const txResponse = await fetch(
        `${this.ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${this.etherscanApiKey}`
      );
      const txData: EtherscanResponse = await txResponse.json();
      
      // Get token transfers
      const tokenResponse = await fetch(
        `${this.ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${this.etherscanApiKey}`
      );
      const tokenData: EtherscanResponse = await tokenResponse.json();

      const result = {
        balance: parseInt(balanceData.result) / 1e18, // Convert wei to ETH
        transactionCount: txData.status === '1' ? txData.result.length : 0,
        transactions: txData.status === '1' ? txData.result.slice(0, 50) : [],
        tokenTransfers: tokenData.status === '1' ? tokenData.result.slice(0, 50) : []
      };

      console.log(`✅ [ETHEREUM] Successfully fetched real data:`, result);
      return result;
    } catch (error) {
      console.error('❌ [ETHEREUM] API error:', error);
      throw new Error(`Failed to fetch Ethereum address data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Risk scoring based on real transaction data
  calculateRealRiskScore(networkData: any, network: 'bitcoin' | 'ethereum'): {
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    riskFactors: Record<string, boolean>;
    explanation: string;
  } {
    let riskScore = 0;
    const riskFactors = {
      sanctioned: false,
      fraud_reports: false,
      dark_market_exposure: false,
      mixer_usage: false,
      high_frequency_trading: false
    };

    // High transaction volume risk
    const txCount = networkData.transactionCount || networkData.transactions?.length || 0;
    if (txCount > 10000) {
      riskScore += 4;
      riskFactors.high_frequency_trading = true;
    } else if (txCount > 1000) {
      riskScore += 2;
      riskFactors.high_frequency_trading = true;
    } else if (txCount > 100) {
      riskScore += 1;
    }

    // High value risk
    const balance = networkData.balance || 0;
    if (network === 'bitcoin' && balance > 100) { // > 100 BTC
      riskScore += 3;
    } else if (network === 'ethereum' && balance > 1000) { // > 1000 ETH
      riskScore += 3;
    } else if (network === 'bitcoin' && balance > 10) { // > 10 BTC
      riskScore += 1;
    } else if (network === 'ethereum' && balance > 100) { // > 100 ETH
      riskScore += 1;
    }

    // Pattern analysis for potential mixing behavior
    if (networkData.transactions && txCount > 20) {
      // For Bitcoin: Look for many small outputs (potential mixing)
      if (network === 'bitcoin') {
        const smallTxCount = networkData.transactions.filter((tx: any) => 
          tx.vout && tx.vout.some((out: any) => out.value < 1000000) // < 0.01 BTC
        ).length;
        
        if (smallTxCount > txCount * 0.7) {
          riskScore += 3;
          riskFactors.mixer_usage = true;
        }
      }
      
      // For Ethereum: Look for round number transactions (potential mixing)
      if (network === 'ethereum') {
        const roundTxCount = networkData.transactions.filter((tx: any) => {
          const value = parseInt(tx.value) / 1e18;
          return value === Math.round(value) && value > 0; // Round numbers
        }).length;
        
        if (roundTxCount > txCount * 0.5) {
          riskScore += 2;
          riskFactors.mixer_usage = true;
        }
      }
    }

    // Very high frequency trading pattern
    if (txCount > 50000) {
      riskScore += 2;
      riskFactors.dark_market_exposure = true; // High volume could indicate exchange or marketplace
    }

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High';
    if (riskScore >= 6) riskLevel = 'High';
    else if (riskScore >= 3) riskLevel = 'Medium';
    else riskLevel = 'Low';

    const explanation = `Real-time blockchain analysis of ${network} address shows ${riskLevel.toLowerCase()} risk indicators. Analyzed ${txCount} transactions with current balance of ${balance.toFixed(6)} ${network.toUpperCase()}. Risk factors include transaction patterns, volume analysis, and behavioral indicators.`;

    return {
      riskScore: Math.min(riskScore, 10),
      riskLevel,
      riskFactors,
      explanation
    };
  }

  // Entity attribution based on real data patterns
  deriveEntityAttribution(networkData: any, network: 'bitcoin' | 'ethereum'): {
    name: string;
    type: string;
    risk_level: string;
    confidence: number;
  } {
    const txCount = networkData.transactionCount || networkData.transactions?.length || 0;
    const balance = networkData.balance || 0;

    // Enhanced entity classification based on real transaction patterns
    if (txCount > 100000) {
      return {
        name: 'Major Exchange or Service',
        type: 'exchange',
        risk_level: 'Medium',
        confidence: 0.85
      };
    } else if (txCount > 10000) {
      return {
        name: 'Commercial Exchange',
        type: 'exchange',
        risk_level: 'Medium',
        confidence: 0.75
      };
    } else if (txCount > 1000 && balance > (network === 'bitcoin' ? 10 : 100)) {
      return {
        name: 'Institutional Wallet',
        type: 'custodial',
        risk_level: 'Low',
        confidence: 0.65
      };
    } else if (balance > (network === 'bitcoin' ? 100 : 1000)) {
      return {
        name: 'High-Value Wallet',
        type: 'private',
        risk_level: 'Medium',
        confidence: 0.6
      };
    } else if (txCount > 500) {
      return {
        name: 'Active Trading Wallet',
        type: 'private',
        risk_level: 'Low',
        confidence: 0.55
      };
    } else {
      return {
        name: 'Personal Wallet',
        type: 'private',
        risk_level: 'Low',
        confidence: 0.45
      };
    }
  }

  // Calculate volume metrics from real data
  calculateVolumeMetrics(networkData: any, network: 'bitcoin' | 'ethereum') {
    const balance = networkData.balance || 0;
    const txCount = networkData.transactionCount || networkData.transactions?.length || 0;
    const totalReceived = networkData.totalReceived || 0;
    const totalSent = networkData.totalSent || 0;
    
    // Use real received/sent data if available, otherwise estimate
    const inboundVolume = totalReceived || (balance * (txCount > 0 ? Math.log(txCount + 1) * 0.6 : 1));
    const outboundVolume = totalSent || (balance * (txCount > 0 ? Math.log(txCount + 1) * 0.5 : 0.8));
    
    // Current market prices (rough estimates - in production, fetch from price API)
    const usdPrice = network === 'bitcoin' ? 45000 : 2500;
    
    return {
      lifetime_value: {
        inbound: inboundVolume,
        outbound: outboundVolume,
        net: balance,
        usd_equivalent: balance * usdPrice
      },
      average_transaction_size: txCount > 0 ? (inboundVolume + outboundVolume) / (txCount * 2) : balance
    };
  }
}

export const realBlockchainAPI = new RealBlockchainAPI();
