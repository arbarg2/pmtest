import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Database, 
  Clock, 
  TrendingUp, 
  Activity,
  CheckCircle2
} from 'lucide-react';

interface PerformanceMetricsProps {
  cacheStats: {
    size: number;
    hitRate: string;
    totalRequests: number;
  };
  queueStats: {
    queueLength: number;
    activeJobs: number;
    processing: boolean;
  };
  className?: string;
}

export const PerformanceMetrics = ({ 
  cacheStats, 
  queueStats, 
  className 
}: PerformanceMetricsProps) => {
  const getCacheHealthColor = (hitRate: string) => {
    const rate = parseFloat(hitRate);
    if (rate >= 70) return 'text-success';
    if (rate >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getQueueHealthColor = (queueLength: number) => {
    if (queueLength === 0) return 'text-success';
    if (queueLength <= 5) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className={`bg-card/95 backdrop-blur ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <span>Performance Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Performance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Cache Performance</span>
            </div>
            <Badge 
              variant="outline" 
              className={getCacheHealthColor(cacheStats.hitRate)}
            >
              {cacheStats.hitRate} Hit Rate
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-lg font-bold text-primary">
                {cacheStats.size}
              </div>
              <div className="text-xs text-muted-foreground">Cached</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-lg font-bold text-accent">
                {cacheStats.totalRequests}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className={`text-lg font-bold ${getCacheHealthColor(cacheStats.hitRate)}`}>
                {cacheStats.hitRate}
              </div>
              <div className="text-xs text-muted-foreground">Hit Rate</div>
            </div>
          </div>
        </div>

        {/* Background Processing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Background Jobs</span>
            </div>
            <div className="flex items-center space-x-2">
              {queueStats.processing ? (
                <Badge variant="default" className="bg-primary">
                  <Clock className="w-3 h-3 mr-1" />
                  Processing
                </Badge>
              ) : (
                <Badge variant="outline" className="text-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Idle
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-muted/50 rounded">
              <div className={`text-lg font-bold ${getQueueHealthColor(queueStats.queueLength)}`}>
                {queueStats.queueLength}
              </div>
              <div className="text-xs text-muted-foreground">Queued</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-lg font-bold text-primary">
                {queueStats.activeJobs}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>

          {queueStats.queueLength > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Background processing optimizes performance without blocking analysis
            </div>
          )}
        </div>

        {/* Performance Indicators */}
        <div className="pt-2 border-t border-muted">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">System Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-success font-medium">Optimized</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};