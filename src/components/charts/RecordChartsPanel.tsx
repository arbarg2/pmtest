
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronUp, ChevronDown, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DailyLookup {
  day: string;
  count: number;
}

interface RiskDistribution {
  risk_level: string;
  count: number;
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

export function RecordChartsPanel() {
  const [isVisible, setIsVisible] = useState(true);
  const [dailyData, setDailyData] = useState<DailyLookup[]>([]);
  const [riskData, setRiskData] = useState<RiskDistribution[]>([]);
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
      
      // Fetch daily lookups
      const { data: dailyLookups, error: dailyError } = await supabase
        .from('investigation_records')
        .select('created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (dailyError) throw dailyError;

      // Process daily data
      const dailyMap = new Map<string, number>();
      dailyLookups?.forEach(record => {
        const day = new Date(record.created_at).toISOString().split('T')[0];
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      });

      const dailyChartData = Array.from(dailyMap.entries()).map(([day, count]) => ({
        day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      }));

      // Fetch risk distribution
      const { data: riskLookups, error: riskError } = await supabase
        .from('investigation_records')
        .select('risk_level')
        .eq('user_id', user?.id);

      if (riskError) throw riskError;

      // Process risk data
      const riskMap = new Map<string, number>();
      riskLookups?.forEach(record => {
        const level = record.risk_level || 'Unknown';
        riskMap.set(level, (riskMap.get(level) || 0) + 1);
      });

      const riskChartData = Array.from(riskMap.entries()).map(([risk_level, count]) => ({
        risk_level,
        count
      }));

      setDailyData(dailyChartData);
      setRiskData(riskChartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Analytics Overview</CardTitle>
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
          <CardTitle className="text-lg">Analytics Overview</CardTitle>
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
            {/* Daily Lookups Chart */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium">Lookups Over Time</h3>
              </div>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  No lookups found yet
                </div>
              )}
            </div>

            {/* Risk Distribution Chart */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <PieChartIcon className="w-4 h-4 text-green-600" />
                <h3 className="font-medium">Risk Level Distribution</h3>
              </div>
              {riskData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ risk_level, percent }) => `${risk_level} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  No risk data available
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
