
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Folder
} from 'lucide-react';
import { caseManagementService } from '@/services/caseManagement';
import { useToast } from '@/hooks/use-toast';

interface CaseRecord {
  id: string;
  case_id: string;
  wallet_address: string;
  network: string;
  risk_level: string;
  risk_score: number;
  case_status: string;
  case_created_at: string;
  is_case: boolean;
}

export default function AllCases() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [user]);

  useEffect(() => {
    filterCases();
  }, [cases, searchTerm, statusFilter, riskLevelFilter]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const result = await caseManagementService.getCases(user?.id || '');
      
      if (result.success && result.cases) {
        setCases(result.cases);
      } else {
        console.error('Error fetching cases:', result.error);
        toast({
          title: "Error",
          description: "Failed to fetch cases",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = [...cases];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(case_ => 
        case_.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.case_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.case_status === statusFilter);
    }
    
    // Apply risk level filter
    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.risk_level === riskLevelFilter);
    }
    
    setFilteredCases(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950 dark:border-blue-800';
      case 'escalated': return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950 dark:border-orange-800';
      case 'cleared': return 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-800';
      case 'closed': return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-950 dark:border-gray-800';
      default: return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-800';
      case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950 dark:border-yellow-800';
      case 'Low': return 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950 dark:border-green-800';
      default: return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-950 dark:border-gray-800';
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

  const handleViewCase = (caseRecord: CaseRecord) => {
    navigate(`/record/${caseRecord.id}`);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center">
                <Folder className="w-6 h-6 mr-3 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    All Cases
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage and analyze all investigation cases
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="bg-white/90 backdrop-blur shadow-xl border-0 dark:bg-slate-900/90">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Folder className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
                Investigation Cases
              </div>
              <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                {filteredCases.length} Cases
              </Badge>
            </CardTitle>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by address or Case ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-800 dark:border-slate-600"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 dark:bg-slate-800 dark:border-slate-600">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

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
                <p className="mt-2 text-slate-600 dark:text-slate-300">Loading cases...</p>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-300">
                  No cases found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.map((caseRecord) => (
                      <TableRow key={caseRecord.id}>
                        <TableCell>
                          <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                            {caseRecord.case_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm font-mono break-all">
                            {caseRecord.wallet_address.slice(0, 12)}...{caseRecord.wallet_address.slice(-8)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{caseRecord.network}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-lg">
                            {caseRecord.risk_score.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRiskColor(caseRecord.risk_level)} text-xs px-2 py-1 font-medium`}>
                            {caseRecord.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(caseRecord.case_status)} text-xs px-2 py-1 font-medium`}>
                            {caseRecord.case_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(caseRecord.case_created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCase(caseRecord)}
                            className="flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
