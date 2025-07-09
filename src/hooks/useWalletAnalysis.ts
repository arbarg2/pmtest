
import { useState } from 'react';
import { blockTraceAPI, WalletRiskResponse } from '@/services/api';
import { lookupRecordService } from '@/services/lookupRecords';
import { useToast } from '@/hooks/use-toast';

export function useWalletAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<WalletRiskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentLookupRecord, setCurrentLookupRecord] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeWallet = async (address: string) => {
    if (!address.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const startTime = Date.now();
      const result = await blockTraceAPI.analyzeWallet(address);
      const endTime = Date.now();

      // Automatically create lookup record
      const lookupRecord = await lookupRecordService.createLookupRecord(result);
      setCurrentLookupRecord(lookupRecord.id);

      setAnalysisData(result);
      
      toast({
        title: "Analysis Complete",
        description: `Analyzed in ${endTime - startTime}ms - ${result.risk_level} risk detected. Lookup record created: ${lookupRecord.id}`,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = async (address: string, format: 'pdf' | 'json' = 'pdf') => {
    try {
      const report = await blockTraceAPI.generateReport(address, format);
      
      if (format === 'pdf' && report instanceof Blob) {
        const url = URL.createObjectURL(report);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rian-report-${address.slice(0, 8)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Report Generated",
        description: `${format.toUpperCase()} report ready for download`,
      });

      return report;
    } catch (err) {
      toast({
        title: "Report Generation Failed",
        description: err instanceof Error ? err.message : 'Failed to generate report',
        variant: "destructive",
      });
    }
  };

  return {
    isAnalyzing,
    analysisData,
    error,
    currentLookupRecord,
    analyzeWallet,
    generateReport,
  };
}
