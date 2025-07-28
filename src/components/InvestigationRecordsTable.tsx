
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  AlertTriangle,
  Shield,
  User,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';

interface InvestigationRecord {
  id: string;
  record_id: string;
  wallet_address: string;
  network: string;
  risk_level: string;
  risk_score: number;
  investigation_status: string;
  analyst_notes: string;
  created_at: string;
  updated_at: string;
  is_case: boolean;
  case_id?: string;
  case_status?: string;
}

export const InvestigationRecordsTable = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<InvestigationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InvestigationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [analystFilter, setAnalystFilter] = useState('all');
  const [uniqueAnalysts, setUniqueAnalysts] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadRecords();
    }
  }, [user]);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, riskFilter, statusFilter, analystFilter]);

  const loadRecords = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await supabaseLookupRecords.getLookupRecords(user.id);
      
      if (result.success && result.records) {
        setRecords(result.records);
        
        // Extract unique analysts from records
        const analysts = new Set<string>();
        result.records.forEach(record => {
          const notes = record.analyst_notes || '';
          const assignedMatch = notes.match(/Assigned to: (.+)/);
          if (assignedMatch) {
            analysts.add(assignedMatch[1]);
          }
        });
        setUniqueAnalysts(Array.from(analysts));
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    // Search filter (wallet address, record ID, or analyst name)
    if (searchTerm) {
      filtered = filtered.filter(record => {
        const searchLower = searchTerm.toLowerCase();
        const assignedAnalyst = extractAnalystFromNotes(record.analyst_notes);
        
        return (
          record.wallet_address.toLowerCase().includes(searchLower) ||
          record.record_id.toLowerCase().includes(searchLower) ||
          (assignedAnalyst && assignedAnalyst.toLowerCase().includes(searchLower))
        );
      });
    }

    // Risk level filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(record => record.risk_level === riskFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.investigation_status === statusFilter);
    }

    // Analyst filter
    if (analystFilter !== 'all') {
      filtered = filtered.filter(record => {
        const assignedAnalyst = extractAnalystFromNotes(record.analyst_notes);
        return assignedAnalyst === analystFilter;
      });
    }

    setFilteredRecords(filtered);
  };

  const extractAnalystFromNotes = (notes: string): string | null => {
    if (!notes) return null;
    const assignedMatch = notes.match(/Assigned to: (.+)/);
    return assignedMatch ? assignedMatch[1] : null;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cleared': return 'bg-green-100 text-green-800 border-green-200';
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      case 'blocked': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewRecord = (record: InvestigationRecord) => {
    navigate(`/record/${record.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by address, ID, or analyst..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Risk Filter */}
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="High">High Risk</SelectItem>
                <SelectItem value="Medium">Medium Risk</SelectItem>
                <SelectItem value="Low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            {/* Analyst Filter */}
            <Select value={analystFilter} onValueChange={setAnalystFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by analyst" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Analysts</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {uniqueAnalysts.map(analyst => (
                  <SelectItem key={analyst} value={analyst}>{analyst}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('all');
                setStatusFilter('all');
                setAnalystFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Investigation Records ({filteredRecords.length})</span>
            <Button variant="outline" onClick={loadRecords}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {records.length === 0 ? 'No Records Found' : 'No Matching Records'}
              </h3>
              <p className="text-gray-500">
                {records.length === 0 
                  ? 'Start by performing wallet analysis to create investigation records.'
                  : 'Try adjusting your search filters to find the records you\'re looking for.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const assignedAnalyst = extractAnalystFromNotes(record.analyst_notes);
                  
                  return (
                    <TableRow key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {record.is_case && (
                            <Badge variant="secondary" className="text-xs">CASE</Badge>
                          )}
                          {record.record_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                          {record.wallet_address.slice(0, 8)}...{record.wallet_address.slice(-6)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-xs">
                          {record.network}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(record.risk_level)}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {record.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.investigation_status)}>
                          {record.investigation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignedAnalyst ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">{assignedAnalyst}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <User className="w-4 h-4" />
                            <span className="text-sm">Unassigned</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewRecord(record)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
