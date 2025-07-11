
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Eye, 
  Filter,
  Calendar,
  Hash,
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface InvestigationRecord {
  id: string;
  record_id: string;
  wallet_address: string;
  network: string;
  risk_score: number;
  risk_level: string;
  analysis_data: any;
  created_at: string;
  updated_at: string;
}

export function InvestigationRecordsTable() {
  const [records, setRecords] = useState<InvestigationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('investigation_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`wallet_address.ilike.%${searchTerm}%,record_id.ilike.%${searchTerm}%`);
      }

      if (riskLevelFilter !== 'all') {
        query = query.eq('risk_level', riskLevelFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching records:', error);
        toast({
          title: "Error",
          description: "Failed to fetch investigation records",
          variant: "destructive",
        });
      } else {
        setRecords(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [searchTerm, riskLevelFilter]);

  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return {
          color: 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-800',
          icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        };
      case 'Medium':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950 dark:border-yellow-800',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        };
      case 'High':
      case 'Critical':
        return {
          color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-800',
          icon: <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
        };
      default:
        return {
          color: 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-950 dark:border-gray-800',
          icon: <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (record: InvestigationRecord) => {
    // Store the record data for the detailed view
    localStorage.setItem('currentRecord', JSON.stringify(record));
    navigate(`/analysis/${record.record_id}`);
  };

  if (!user) {
    return (
      <Card className="bg-white/90 backdrop-blur shadow-xl border-0 dark:bg-slate-900/90">
        <CardContent className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">
            Please sign in to view your investigation records.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur shadow-xl border-0 dark:bg-slate-900/90">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Hash className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
            Investigation Records
          </div>
          <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
            {records.length} Records
          </Badge>
        </CardTitle>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by address or Record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:bg-slate-800 dark:border-slate-600"
            />
          </div>
          
          <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
            <SelectTrigger className="w-48 dark:bg-slate-800 dark:border-slate-600">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-300">
              No investigation records found. Start by analyzing a wallet address.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const riskConfig = getRiskConfig(record.risk_level);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                          {record.record_id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm font-mono break-all">
                          {record.wallet_address.slice(0, 12)}...{record.wallet_address.slice(-8)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.network}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-lg">
                          {record.risk_score.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${riskConfig.color} text-xs px-2 py-1 font-medium`}>
                          {riskConfig.icon}
                          <span className="ml-1">{record.risk_level}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(record.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(record)}
                          className="flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
