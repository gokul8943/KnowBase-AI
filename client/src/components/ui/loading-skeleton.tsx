import { cn } from '../../utils/cn';
import type { HTMLAttributes } from 'react';

interface LoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function LoadingSkeleton({ className, variant = 'text', width, height, lines = 1, style, ...props }: LoadingSkeletonProps) {
  const baseStyles = 'animate-pulse bg-muted rounded';

  if (variant === 'circular') {
    return (
      <div
        className={cn(baseStyles, 'rounded-full', className)}
        style={{ width: width || '2.5rem', height: height || '2.5rem', ...style }}
        {...props}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={cn(baseStyles, className)}
        style={{ width: width || '100%', height: height || '1rem', ...style }}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('space-y-3', className)} {...props}>
        <div className={cn(baseStyles, 'h-6 w-3/4')} />
        <div className={cn(baseStyles, 'h-4 w-1/2')} />
        <div className={cn(baseStyles, 'h-4 w-1/4')} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(baseStyles, 'h-4', i === lines - 1 && 'w-3/4', 'w-full')}
        />
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                <div className="h-4 w-3/4 animate-pulse bg-muted rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-4 align-middle">
                  <div className="h-4 w-full animate-pulse bg-muted rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ListSkeletonProps {
  items?: number;
}

export function ListSkeleton({ items = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full animate-pulse bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse bg-muted rounded" />
            <div className="h-3 w-1/4 animate-pulse bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}