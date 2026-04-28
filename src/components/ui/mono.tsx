import * as React from 'react';
import { cn } from '@/lib/utils';

interface MonoProps extends React.HTMLAttributes<HTMLSpanElement> {
  truncate?: boolean;
}

export const Mono = React.forwardRef<HTMLSpanElement, MonoProps>(
  ({ className, truncate, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'font-mono text-[0.92em] tracking-tight',
        truncate && 'truncate',
        className
      )}
      {...props}
    />
  )
);
Mono.displayName = 'Mono';

export const truncateMiddle = (value: string, head = 6, tail = 4) => {
  if (!value || value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
};
