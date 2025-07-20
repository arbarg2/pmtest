
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Clock, 
  Users,
  FileText,
  Plus,
  Eye,
  Filter
} from 'lucide-react';
import { InvestigationRecordsTable } from '@/components/InvestigationRecordsTable';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseLookupRecords } from '@/services/supabaseLookupRecords';
import { useNavigate } from 'react-router-dom';

export function AnalystDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total_lookups: 0,
    high_risk: 0,
    medium_risk: 0,
    low_risk: 0,
    total_cases: 0,
    open_cases: 0,
    escalated_cases: 0,
    cleared_cases: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('📊 Loading dashboard data for user:', user.id);
      
      // Load records
      const recordsResult = await supabaseLookupRecords.getLookupRecords(user.id);
      
      if (recordsResult.success && recordsResult.records) {
        console.log('✅ Loaded records:', recordsResult.records.length);
        setRecords(recordsResult.records);
        
        // Filter cases from records
        const caseRecords = recordsResult.records.filter(r => r.is_case === true);
        setCases(caseRecords);
        console.log('✅ Loaded cases:', caseRecords.length);
        
        // Calculate stats from the loaded data
        const totalLookups = recordsResult.records.length;
        const highRisk = recordsResult.records.filter(r => r.risk_level === 'High').length;
        const mediumRisk = recordsResult.records.filter(r => r.risk_level === 'Medium').length;
        const lowRisk = recordsResult.records.filter(r => r.risk_level === 'Low').length;
        
        const totalCases = caseRecords.length;
        const openCases = caseRecords.filter(r => r.case_status === 'open').length;
        const escalatedCases = caseRecords.filter(r => r.case_status === 'escalated').length;
        const clearedCases = caseRecords.filter(r => r.case_status === 'cleared').length;
        
        setStats({
          total_lookups: totalLookups,
          high_risk: highRisk,
          medium_risk: mediumRisk,
          low_risk: lowRisk,
          total_cases: totalCases,
          open_cases: openCases,
          escalated_cases: escalatedCases,
          cleared_cases: clearedCases
        });
        
        console.log('📊 Dashboard stats calculated:', {
          totalLookups,
          totalCases,
          highRisk,
          mediumRisk,
          lowRisk
        });
      } else {
        console.error('❌ Failed to load records:', recordsResult.error);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    console.log('🔄 Refreshing dashboard data...');
    loadDashboardData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lookups</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_lookups}</div>
            <p className="text-xs text-muted-foreground">
              Investigation records created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.high_risk}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_cases}</div>
            <p className="text-xs text-muted-foreground">
              {stats.open_cases} open, {stats.escalated_cases} escalated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.medium_risk}</div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="records" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Recent Investigations
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Case Management
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Investigation Records</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{records.length} records</Badge>
                  <Button variant="outline" size="sm" onClick={() => navigate('/all-records')}>
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InvestigationRecordsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Cases</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{cases.length} cases</Badge>
                  <Button variant="outline" size="sm" onClick={() => navigate('/cases')}>
                    <Eye className="w-4 h-4 mr-2" />
                    View All Cases
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Cases</h3>
                  <p className="text-gray-500">
                    Create cases from investigation records to enable full case management features.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cases.slice(0, 5).map((caseRecord) => (
                    <div key={caseRecord.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="font-medium text-slate-900">{caseRecord.case_id}</h3>
                            <Badge variant={caseRecord.case_status === 'open' ? 'default' : 
                                         caseRecord.case_status === 'escalated' ? 'destructive' : 'secondary'}>
                              {caseRecord.case_status}
                            </Badge>
                            <Badge variant={caseRecord.risk_level === 'High' ? 'destructive' : 
                                         caseRecord.risk_level === 'Medium' ? 'secondary' : 'outline'}>
                              {caseRecord.risk_level} Risk
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-slate-600 space-y-1">
                            <div className="flex items-center space-x-4">
                              <span className="font-mono">{caseRecord.wallet_address}</span>
                              <span className="uppercase text-xs bg-slate-100 px-2 py-1 rounded">
                                {caseRecord.network}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>Created: {new Date(caseRecord.case_created_at).toLocaleDateString()}</span>
                              <span>Risk Score: {caseRecord.risk_score}/10</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => navigate(`/record/${caseRecord.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Case
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
