
import { useState, useEffect } from 'react';
import { LookupRecord, LookupRecordFilters } from '@/types/lookupRecords';
import { lookupRecordService } from '@/services/lookupRecords';
import { useToast } from '@/hooks/use-toast';

export function useLookupRecords() {
  const [records, setRecords] = useState<LookupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const loadRecords = async (filters?: LookupRecordFilters) => {
    setIsLoading(true);
    try {
      const data = await lookupRecordService.getLookupRecords(filters);
      setRecords(data);
    } catch (error) {
      toast({
        title: "Error Loading Records",
        description: "Failed to load lookup records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecord = async (id: string, updates: Partial<LookupRecord['analyst_fields']>) => {
    try {
      const updatedRecord = await lookupRecordService.updateLookupRecord(id, updates);
      if (updatedRecord) {
        setRecords(prev => prev.map(record => 
          record.id === id ? updatedRecord : record
        ));
        toast({
          title: "Record Updated",
          description: "Lookup record has been successfully updated",
        });
        return updatedRecord;
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update lookup record",
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await lookupRecordService.getLookupStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadRecords();
    loadStats();
  }, []);

  return {
    records,
    stats,
    isLoading,
    loadRecords,
    updateRecord,
    loadStats,
  };
}
