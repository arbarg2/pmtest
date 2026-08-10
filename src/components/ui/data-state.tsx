import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LoadingCardProps {
  title: string;
  rows?: number;
}

/** Realistic skeleton placeholder that mirrors the shape of a data panel. */
export const LoadingCard = ({ title, rows = 3 }: LoadingCardProps) => (
  <Card aria-busy="true" aria-live="polite">
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full shrink-0" />
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">Crunching the numbers — this usually takes a second.</p>
    </CardContent>
  </Card>
);

interface ErrorCardProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/** Friendly, non-technical failure state with a retry affordance. */
export const ErrorCard = ({
  title,
  message = "We couldn't load this data just now. Nothing has been lost — try again in a moment.",
  onRetry,
  isRetrying,
}: ErrorCardProps) => (
  <Card className="border-[hsl(var(--risk-medium))]/40" role="alert">
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[hsl(var(--risk-medium))]" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying…' : 'Try again'}
        </Button>
      )}
    </CardContent>
  </Card>
);

interface DataStateProps {
  status: DataStatus;
  title: string;
  rows?: number;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

/** Renders loading / error / ready states for a single data panel. */
export const DataState = ({ status, title, rows, errorMessage, onRetry, children }: DataStateProps) => {
  if (status === 'loading' || status === 'idle') return <LoadingCard title={title} rows={rows} />;
  if (status === 'error') {
    return <ErrorCard title={title} message={errorMessage} onRetry={onRetry} isRetrying={false} />;
  }
  return <>{children}</>;
};
