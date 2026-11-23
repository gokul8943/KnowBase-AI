import { useState, useRef, useEffect } from 'react';
import { useOrganization } from '../../../context/OrganizationContext';
import { Button } from '../../../components/ui/button';
import { ChevronDown, Building2, Plus, Check } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface OrganizationSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function OrganizationSwitcher({ className, showLabel = true }: OrganizationSwitcherProps) {
  const { organizations, activeOrganization, setActiveOrganization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (organizations.length === 0) {
    return null;
  }

  if (organizations.length === 1 && !showLabel) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate max-w-[150px]">
          {activeOrganization?.name || organizations[0]?.name || 'No Organization'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <Button
        variant="glass"
        onClick={() => setIsOpen(!isOpen)}
        className={cn('flex items-center space-x-2 h-9 px-3 gap-2', showLabel ? '' : 'justify-center')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch organization"
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        {showLabel && (
          <span className="text-sm font-medium truncate max-w-[150px]">
            {activeOrganization?.name}
          </span>
        )}
        {showLabel && (
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground', isOpen && 'rotate-180')} />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black/5 focus:outline-none border border-border">
          <div className="py-1">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setActiveOrganization(org);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center space-x-2 px-3 py-2 text-sm text-left',
                  activeOrganization?.id === org.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
                role="option"
                aria-selected={activeOrganization?.id === org.id}
              >
                <Building2 className="h-4 w-4" />
                <span className="truncate flex-1">{org.name}</span>
                {activeOrganization?.id === org.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
          <hr className="my-1 border-border" />
          <button
            onClick={() => {
              setIsOpen(false);
            }}
            className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Organization</span>
          </button>
        </div>
      )}
    </div>
  );
}