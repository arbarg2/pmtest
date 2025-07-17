
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronUp, ChevronDown, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DailyCase {
  day: string;
  count: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function CaseChartsPanel() {
  const [isVisible, setIsVisible] = useState(true);
  const [dailyData, setDailyData] = useState<DailyCase[]>([]);
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      
      // Fetch cases data (filtering by is_case = true)
      const { data: cases, error: casesError } = await supabase
        .from('investigation_records')
        .select('created_at, case_status')
        .eq('user_id', user?.id)
        .eq('is_case', true)
        .order('created_at', { ascending: true });

      if (casesError) throw casesError;

      // Process daily data
      const dailyMap = new Map<string, number>();
      cases?.forEach(record => {
        const day = new Date(record.created_at).toISOString().split('T')[0];
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      });

      const dailyChartData = Array.from(dailyMap.entries()).map(([day, count]) => ({
        day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      }));

      // Process status data
      const statusMap = new Map<string, number>();
      cases?.forEach(record => {
        const status = record.case_status || 'open';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const statusChartData = Array.from(statusMap.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }));

      setDailyData(dailyChartData);
      setStatusData(statusChartData);
    } catch (error) {
      console.error('Error fetching case chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Case Analytics</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(true)}
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Charts
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Case Analytics</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Hide Charts
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Cases Chart */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium">Cases Created Over Time</h3>
              </div>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  No cases found yet
                </div>
              )}
            </div>

            {/* Status Distribution Chart */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <PieChartIcon className="w-4 h-4 text-green-600" />
                <h3 className="font-medium">Case Status Distribution</h3>
              </div>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  No case status data available
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
