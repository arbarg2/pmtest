
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
import ClusterView from '@/components/dashboard/ClusterView';

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
            <TabsTrigger value="clusters" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clusters
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
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Active Cases</h3>
                  <p className="text-muted-foreground">
                    Create cases from investigation records to enable full case management features.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cases.slice(0, 5).map((caseRecord) => (
                    <div key={caseRecord.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="font-medium text-foreground">{caseRecord.case_id}</h3>
                            <Badge variant={caseRecord.case_status === 'open' ? 'default' : 
                                         caseRecord.case_status === 'escalated' ? 'destructive' : 'secondary'}>
                              {caseRecord.case_status}
                            </Badge>
                            <Badge variant={caseRecord.risk_level === 'High' ? 'destructive' : 
                                         caseRecord.risk_level === 'Medium' ? 'secondary' : 'outline'}>
                              {caseRecord.risk_level} Risk
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center space-x-4">
                              <span className="font-mono">{caseRecord.wallet_address}</span>
                              <span className="uppercase text-xs bg-muted px-2 py-1 rounded">
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

        <TabsContent value="clusters" className="space-y-4">
          <ClusterView />
        </TabsContent>
      </Tabs>

    </div>
  );
}
