import { WalletRiskResponse } from './api';

interface CacheEntry {
  data: WalletRiskResponse;
  timestamp: number;
  expiresAt: number;
}

interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  averageResponseTime: number;
  backgroundJobs: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private metrics: PerformanceMetrics = {
    apiCalls: 0,
    cacheHits: 0,
    averageResponseTime: 0,
    backgroundJobs: 0
  };

  private getCacheKey(address: string, network: string): string {
    return `${network}:${address.toLowerCase()}`;
  }

  async get(address: string, network: string): Promise<WalletRiskResponse | null> {
    const key = this.getCacheKey(address, network);
    const entry = this.cache.get(key);

    if (entry && entry.expiresAt > Date.now()) {
      this.metrics.cacheHits++;
      console.log(`🚀 CACHE HIT: Found cached data for ${address}`);
      return { ...entry.data, isTemporary: false };
    }

    if (entry) {
      this.cache.delete(key);
      console.log(`⏰ CACHE EXPIRED: Removing stale data for ${address}`);
    }

    return null;
  }

  set(address: string, network: string, data: WalletRiskResponse): void {
    const key = this.getCacheKey(address, network);
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data: { ...data },
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    });

    console.log(`💾 CACHED: Stored analysis for ${address} (expires in ${this.CACHE_DURATION / 1000}s)`);
  }

  invalidate(address: string, network: string): void {
    const key = this.getCacheKey(address, network);
    this.cache.delete(key);
    console.log(`🗑️ CACHE INVALIDATED: Removed ${address} from cache`);
  }

  clear(): void {
    this.cache.clear();
    console.log('🧹 CACHE CLEARED: All entries removed');
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  recordApiCall(responseTime: number): void {
    this.metrics.apiCalls++;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.apiCalls - 1) + responseTime) / this.metrics.apiCalls;
  }

  recordBackgroundJob(): void {
    this.metrics.backgroundJobs++;
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { size: number; hitRate: string; totalRequests: number } {
    const totalRequests = this.metrics.apiCalls + this.metrics.cacheHits;
    const hitRate = totalRequests > 0 
      ? ((this.metrics.cacheHits / totalRequests) * 100).toFixed(1)
      : '0.0';

    return {
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      totalRequests
    };
  }
}

export const cacheService = new CacheService();