import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumb && (
        <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
          {breadcrumb}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {action && (
          <div className="flex items-center space-x-2 sm:ml-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}