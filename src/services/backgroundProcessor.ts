import { WalletRiskResponse } from './api';
import { riskFactorsService } from './riskFactors';
import { storeAnalysisResult } from './walletAnalysisDatabase';
import { cacheService } from './cacheService';

interface BackgroundJob {
  id: string;
  type: 'risk_factors' | 'sanctions_screening' | 'database_storage';
  data: any;
  priority: number;
  retries: number;
  maxRetries: number;
  createdAt: number;
}

class BackgroundProcessor {
  private queue: BackgroundJob[] = [];
  private processing = false;
  private readonly MAX_CONCURRENT_JOBS = 3;
  private readonly RETRY_DELAY = 2000;
  private activeJobs = new Set<string>();

  async addJob(
    type: BackgroundJob['type'], 
    data: any, 
    priority: number = 1
  ): Promise<string> {
    const job: BackgroundJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority,
      retries: 0,
      maxRetries: 3,
      createdAt: Date.now()
    };

    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);

    console.log(`📋 BACKGROUND JOB QUEUED: ${job.type} (ID: ${job.id})`);
    
    if (!this.processing) {
      this.processQueue();
    }

    cacheService.recordBackgroundJob();
    return job.id;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    console.log(`⚡ BACKGROUND PROCESSOR: Starting queue processing (${this.queue.length} jobs)`);

    while (this.queue.length > 0 && this.activeJobs.size < this.MAX_CONCURRENT_JOBS) {
      const job = this.queue.shift();
      if (!job) continue;

      this.activeJobs.add(job.id);
      this.processJob(job).finally(() => {
        this.activeJobs.delete(job.id);
      });
    }

    // Continue processing if there are more jobs
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    } else {
      this.processing = false;
      console.log('✅ BACKGROUND PROCESSOR: Queue processing complete');
    }
  }

  private async processJob(job: BackgroundJob): Promise<void> {
    console.log(`🔄 PROCESSING JOB: ${job.type} (ID: ${job.id})`);
    
    try {
      switch (job.type) {
        case 'risk_factors':
          await this.processRiskFactors(job.data);
          break;
        case 'sanctions_screening':
          await this.processSanctionsScreening(job.data);
          break;
        case 'database_storage':
          await this.processDatabaseStorage(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      console.log(`✅ JOB COMPLETED: ${job.type} (ID: ${job.id})`);
    } catch (error) {
      console.error(`❌ JOB FAILED: ${job.type} (ID: ${job.id})`, error);
      
      if (job.retries < job.maxRetries) {
        job.retries++;
        console.log(`🔄 RETRYING JOB: ${job.type} (attempt ${job.retries}/${job.maxRetries})`);
        
        setTimeout(() => {
          this.queue.unshift(job);
          this.processQueue();
        }, this.RETRY_DELAY * job.retries);
      } else {
        console.error(`💀 JOB PERMANENTLY FAILED: ${job.type} (ID: ${job.id})`);
      }
    }
  }

  private async processRiskFactors(data: {
    recordId: string;
    walletData: WalletRiskResponse;
  }): Promise<void> {
    await riskFactorsService.calculateAndStoreRiskFactors(
      data.recordId,
      data.walletData
    );
  }

  private async processSanctionsScreening(data: {
    recordId: string;
    address: string;
    network: string;
  }): Promise<void> {
    const sanctions = await riskFactorsService.screenSanctions(
      data.address,
      data.network
    );
    
    if (sanctions.length > 0) {
      await riskFactorsService.storeSanctionsScreening(data.recordId, sanctions);
    }
  }

  private async processDatabaseStorage(data: {
    address: string;
    network: string;
    result: WalletRiskResponse;
    userId: string;
  }): Promise<void> {
    await storeAnalysisResult(
      data.address,
      data.network,
      data.result,
      data.userId
    );
  }

  getQueueStats(): {
    queueLength: number;
    activeJobs: number;
    processing: boolean;
  } {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs.size,
      processing: this.processing
    };
  }

  clearQueue(): void {
    this.queue = [];
    console.log('🧹 BACKGROUND QUEUE CLEARED');
  }
}

export const backgroundProcessor = new BackgroundProcessor();