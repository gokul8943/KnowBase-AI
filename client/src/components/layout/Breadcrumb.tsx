import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      {items.map((item, _index) => (
        <span key={item.label} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.href ? (
            <Link
              to={item.href}
              className={cn(
                'text-muted-foreground hover:text-foreground transition-colors',
                item.current && 'text-foreground font-medium'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                'text-muted-foreground',
                item.current && 'text-foreground font-medium'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}