
import { supabase } from '@/integrations/supabase/client';

// Real-time blockchain API integration service - PRODUCTION GRADE
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
  private apiKeyInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize immediately to avoid blocking
  }

  private async initializeApiKey(): Promise<void> {
    if (this.apiKeyInitialized) return;
    
    // Use singleton pattern to avoid multiple simultaneous initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  private async _performInitialization(): Promise<void> {
    try {
      console.log('🔑 Initializing API keys from Supabase...');
      
      const { data, error } = await supabase.functions.invoke('get-api-keys');
      
      if (error) {
        console.error('❌ Failed to load API keys from Supabase:', error);
        throw new Error(`API key initialization failed: ${error.message}`);
      }
      
      if (data?.etherscanApiKey) {
        this.etherscanApiKey = data.etherscanApiKey;
        console.log('✅ Etherscan API key loaded successfully');
      } else {
        console.warn('⚠️ Etherscan API key not found in response:', data);
        // Don't throw error - Bitcoin API can still work
      }
      
      this.apiKeyInitialized = true;
    } catch (error) {
      console.error('❌ API key initialization failed:', error);
      this.apiKeyInitialized = false;
      this.initializationPromise = null; // Reset to allow retry
      
      throw error;
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
      console.log(`🔍 [BITCOIN LIVE] Fetching real-time data for: ${address}`);
      
      // Validate Bitcoin address format
      if (!address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) && !address.startsWith('bc1')) {
        throw new Error(`Invalid Bitcoin address format: ${address}`);
      }
      
      // Get address info with shorter timeout for better performance
      const addressController = new AbortController();
      const addressTimeout = setTimeout(() => addressController.abort(), 8000); // 8s timeout
      
      const addressResponse = await fetch(`${this.BLOCKSTREAM_BASE_URL}/address/${address}`, {
        signal: addressController.signal,
        headers: {
          'User-Agent': 'Rian-Blockchain-Intelligence/1.0'
        }
      });
      
      clearTimeout(addressTimeout);
      
      if (!addressResponse.ok) {
        if (addressResponse.status === 404) {
          throw new Error(`Bitcoin address not found: ${address}`);
        }
        throw new Error(`Blockstream API error: ${addressResponse.status} - ${addressResponse.statusText}`);
      }
      
      const addressInfo: BlockstreamAddressInfo = await addressResponse.json();
      
      // Get transactions with timeout and limit to first 25 for performance
      const txController = new AbortController();
      const txTimeout = setTimeout(() => txController.abort(), 8000);
      
      const txResponse = await fetch(`${this.BLOCKSTREAM_BASE_URL}/address/${address}/txs`, {
        signal: txController.signal,
        headers: {
          'User-Agent': 'Rian-Blockchain-Intelligence/1.0'
        }
      });
      
      clearTimeout(txTimeout);
      
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
        transactions: transactions.slice(0, 25) // Limit for performance
      };

      console.log(`✅ [BITCOIN LIVE] Real-time data retrieved:`, {
        balance: result.balance,
        txCount: result.transactionCount,
        totalReceived: result.totalReceived
      });
      
      return result;
    } catch (error) {
      console.error('❌ [BITCOIN] Live API failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Bitcoin API request timed out. Network may be slow.');
        }
        throw new Error(`Bitcoin API error: ${error.message}`);
      }
      
      throw new Error('Unknown Bitcoin API error');
    }
  }

  // Ethereum API integration using Etherscan
  async getEthereumAddressData(address: string): Promise<{
    balance: number;
    transactionCount: number;
    transactions: EthereumTransaction[];
    tokenTransfers: any[];
  }> {
    // Ensure API key is initialized with timeout
    try {
      await Promise.race([
        this.initializeApiKey(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API key initialization timeout')), 10000)
        )
      ]);
    } catch (error) {
      throw new Error(`Failed to initialize Etherscan API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!this.etherscanApiKey) {
      throw new Error('Etherscan API key not configured. Please add your API key in project settings.');
    }

    try {
      console.log(`🔍 [ETHEREUM LIVE] Fetching real-time data for: ${address}`);
      
      // Validate Ethereum address format
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error(`Invalid Ethereum address format: ${address}`);
      }
      
      const timeout = 8000; // 8 seconds for better performance
      
      // Get ETH balance with timeout
      const balanceController = new AbortController();
      const balanceTimeout = setTimeout(() => balanceController.abort(), timeout);
      
      const balanceResponse = await fetch(
        `${this.ETHERSCAN_BASE_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${this.etherscanApiKey}`,
        { 
          signal: balanceController.signal,
          headers: { 'User-Agent': 'Rian-Blockchain-Intelligence/1.0' }
        }
      );
      clearTimeout(balanceTimeout);
      
      const balanceData: EtherscanResponse = await balanceResponse.json();
      
      if (balanceData.status !== '1') {
        throw new Error(`Etherscan balance API error: ${balanceData.message}`);
      }

      // Get transaction history with timeout and limit to 25 for performance
      const txController = new AbortController();
      const txTimeout = setTimeout(() => txController.abort(), timeout);
      
      const txResponse = await fetch(
        `${this.ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc&apikey=${this.etherscanApiKey}`,
        { 
          signal: txController.signal,
          headers: { 'User-Agent': 'Rian-Blockchain-Intelligence/1.0' }
        }
      );
      clearTimeout(txTimeout);
      
      const txData: EtherscanResponse = await txResponse.json();
      
      // Get token transfers with timeout and limit to 25 for performance
      const tokenController = new AbortController();
      const tokenTimeout = setTimeout(() => tokenController.abort(), timeout);
      
      const tokenResponse = await fetch(
        `${this.ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc&apikey=${this.etherscanApiKey}`,
        { 
          signal: tokenController.signal,
          headers: { 'User-Agent': 'Rian-Blockchain-Intelligence/1.0' }
        }
      );
      clearTimeout(tokenTimeout);
      
      const tokenData: EtherscanResponse = await tokenResponse.json();

      const result = {
        balance: parseInt(balanceData.result) / 1e18, // Convert wei to ETH
        transactionCount: txData.status === '1' ? txData.result.length : 0,
        transactions: txData.status === '1' ? txData.result.slice(0, 25) : [],
        tokenTransfers: tokenData.status === '1' ? tokenData.result.slice(0, 25) : []
      };

      console.log(`✅ [ETHEREUM LIVE] Real-time data retrieved:`, {
        balance: result.balance,
        txCount: result.transactionCount,
        tokenTransfers: result.tokenTransfers.length
      });
      
      return result;
    } catch (error) {
      console.error('❌ [ETHEREUM] Live API failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Ethereum API request timed out. Network may be slow.');
        }
        if (error.message.includes('API key')) {
          throw error; // Re-throw API key errors
        }
        throw new Error(`Ethereum API error: ${error.message}`);
      }
      
      throw new Error('Unknown Ethereum API error');
    }
  }

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
