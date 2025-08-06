import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface ProgressiveAnalysisStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface ProgressiveAnalysisState {
  steps: ProgressiveAnalysisStep[];
  overallProgress: number;
  partialResult?: any;
  finalResult?: any;
}

interface ProgressiveAnalysisDisplayProps {
  state: ProgressiveAnalysisState;
  isVisible: boolean;
}

export const ProgressiveAnalysisDisplay = ({ state, isVisible }: ProgressiveAnalysisDisplayProps) => {
  if (!isVisible || !state) return null;

  const getStepIcon = (step: ProgressiveAnalysisStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStepBadge = (step: ProgressiveAnalysisStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge variant="default" className="bg-success text-success-foreground">Complete</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-primary text-primary-foreground">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className="bg-card/95 backdrop-blur border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Analysis Progress</span>
          <Badge variant="outline" className="bg-accent/10">
            {Math.round(state.overallProgress)}% Complete
          </Badge>
        </CardTitle>
        <Progress value={state.overallProgress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {state.steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon(step)}
              <div>
                <div className="font-medium text-sm">{step.name}</div>
                {step.error && (
                  <div className="text-xs text-destructive mt-1">{step.error}</div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {step.status === 'running' && (
                <div className="text-xs text-muted-foreground">
                  {step.progress}%
                </div>
              )}
              {getStepBadge(step)}
            </div>
          </div>
        ))}

        {state.partialResult && !state.finalResult && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm font-medium text-primary mb-1">
              ⚡ Partial Results Available
            </div>
            <div className="text-xs text-muted-foreground">
              Basic analysis complete. Enhanced results processing in background...
            </div>
          </div>
        )}

        {state.finalResult && (
          <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
            <div className="text-sm font-medium text-success mb-1">
              ✅ Analysis Complete
            </div>
            <div className="text-xs text-muted-foreground">
              Full analysis ready with all risk factors and intelligence data.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};