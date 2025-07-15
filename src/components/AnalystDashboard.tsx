
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search,
  TrendingUp,
  Calendar,
  Eye,
  Folder,
  Database
} from 'lucide-react';
import { caseManagementService } from '@/services/caseManagement';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalCases: number;
  openCases: number;
  escalatedCases: number;
  totalRecords: number;
  highRiskRecords: number;
  recentActivity: number;
}

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

export const AnalystDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    openCases: 0,
    escalatedCases: 0,
    totalRecords: 0,
    highRiskRecords: 0,
    recentActivity: 0
  });
  const [recentCases, setRecentCases] = useState<CaseRecord[]>([]);
  const [recentRecords, setRecentRecords] = useState<CaseRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch cases
      const casesResult = await caseManagementService.getCases(user.id);
      const recordsResult = await caseManagementService.getRecords(user.id);

      if (casesResult.success && recordsResult.success) {
        const cases = casesResult.cases || [];
        const records = recordsResult.records || [];

        // Calculate stats
        const totalCases = cases.length;
        const openCases = cases.filter(c => c.case_status === 'open').length;
        const escalatedCases = cases.filter(c => c.case_status === 'escalated').length;
        const totalRecords = records.length;
        const highRiskRecords = records.filter(r => r.risk_level === 'High').length;
        const recentActivity = records.filter(r => {
          const created = new Date(r.created_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return created > weekAgo;
        }).length;

        setStats({
          totalCases,
          openCases,
          escalatedCases,
          totalRecords,
          highRiskRecords,
          recentActivity
        });

        // Set recent data
        setRecentCases(cases.slice(0, 5));
        setRecentRecords(records.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'escalated': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cleared': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewRecord = (record: CaseRecord) => {
    navigate(`/record/${record.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-white/90 backdrop-blur hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Cases</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCases}</p>
              </div>
              <Folder className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Open Cases</p>
                <p className="text-2xl font-bold text-blue-600">{stats.openCases}</p>
              </div>
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Escalated</p>
                <p className="text-2xl font-bold text-orange-600">{stats.escalatedCases}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Records</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalRecords}</p>
              </div>
              <Database className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.highRiskRecords}</p>
              </div>
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">This Week</p>
                <p className="text-2xl font-bold text-green-600">{stats.recentActivity}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur shadow-lg">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center space-x-2">
            <Folder className="w-4 h-4" />
            <span>Recent Cases</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Recent Records</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Cases</span>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCases.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No cases yet</p>
                  ) : (
                    recentCases.map((case_) => (
                      <div key={case_.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{case_.case_id}</span>
                            <Badge className={getStatusColor(case_.case_status)}>
                              {case_.case_status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 font-mono">
                            {case_.wallet_address.substring(0, 16)}...
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleViewRecord(case_)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Records</span>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('records')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRecords.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No records yet</p>
                  ) : (
                    recentRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{record.record_id}</span>
                            <Badge className={getRiskColor(record.risk_level)}>
                              {record.risk_level}
                            </Badge>
                            {record.is_case && (
                              <Badge variant="outline" className="text-xs">Case</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-mono">
                            {record.wallet_address.substring(0, 16)}...
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleViewRecord(record)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cases" className="mt-6">
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Recent Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCases.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Cases Yet</h3>
                    <p className="text-gray-500">Create cases from wallet lookup records to see them here.</p>
                  </div>
                ) : (
                  recentCases.map((case_) => (
                    <div key={case_.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="font-medium text-slate-900">{case_.case_id}</h3>
                            <Badge className={getStatusColor(case_.case_status)}>
                              {case_.case_status}
                            </Badge>
                            <Badge className={getRiskColor(case_.risk_level)}>
                              {case_.risk_level} Risk
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div className="flex items-center space-x-4">
                              <span className="font-mono">{case_.wallet_address}</span>
                              <span className="uppercase text-xs bg-slate-100 px-2 py-1 rounded">
                                {case_.network}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>Created: {new Date(case_.case_created_at).toLocaleDateString()}</span>
                              <span>Risk Score: {case_.risk_score}/10</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleViewRecord(case_)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Case
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {recentCases.length > 0 && (
                <div className="mt-6 text-center">
                  <Button onClick={() => navigate('/cases')}>
                    View All Cases
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <Card className="bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Recent Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Records Yet</h3>
                    <p className="text-gray-500">Analyze wallet addresses to create records.</p>
                  </div>
                ) : (
                  recentRecords.map((record) => (
                    <div key={record.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="font-medium text-slate-900">{record.record_id}</h3>
                            <Badge className={getRiskColor(record.risk_level)}>
                              {record.risk_level} Risk
                            </Badge>
                            {record.is_case && (
                              <Badge variant="secondary">Case</Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <div className="flex items-center space-x-4">
                              <span className="font-mono">{record.wallet_address}</span>
                              <span className="uppercase text-xs bg-slate-100 px-2 py-1 rounded">
                                {record.network}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>Created: {new Date(record.created_at).toLocaleDateString()}</span>
                              <span>Risk Score: {record.risk_score}/10</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleViewRecord(record)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Record
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
