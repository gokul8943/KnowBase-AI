import { useState } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '../../../components/ui/dropdown-menu';
import type { ListDocumentsParams, DocumentStatus } from '../types/document';

interface DocumentFiltersProps {
  params: ListDocumentsParams;
  onChange: (params: ListDocumentsParams) => void;
  availableTypes: string[];
}

export function DocumentFilters({ params, onChange, availableTypes }: DocumentFiltersProps) {
  const [search, setSearch] = useState(params.search || '');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      onChange({ ...params, search: value || undefined, page: 1 });
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleFileTypeChange = (value: string) => {
    onChange({ ...params, fileType: value || undefined, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onChange({ ...params, status: value as DocumentStatus | undefined, page: 1 });
  };

  const handleSortChange = (sortBy: ListDocumentsParams['sortBy'], sortOrder?: ListDocumentsParams['sortOrder']) => {
    const newSortOrder = params.sortBy === sortBy && params.sortOrder === 'asc' ? 'desc' : 'asc';
    onChange({ ...params, sortBy, sortOrder: sortOrder || newSortOrder });
  };

  const hasActiveFilters = params.search || params.fileType || params.status;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => handleSearchChange('')}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select value={params.fileType || ''} onValueChange={handleFileTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={params.status || ''} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="UPLOADED">Uploaded</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UPLOADING">Uploading</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span>Sort</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuCheckboxItem
              checked={params.sortBy === 'createdAt' && params.sortOrder === 'desc'}
              onCheckedChange={() => handleSortChange('createdAt', 'desc')}
            >
              Newest First
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={params.sortBy === 'createdAt' && params.sortOrder === 'asc'}
              onCheckedChange={() => handleSortChange('createdAt', 'asc')}
            >
              Oldest First
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={params.sortBy === 'name' && params.sortOrder === 'asc'}
              onCheckedChange={() => handleSortChange('name', 'asc')}
            >
              Name (A-Z)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={params.sortBy === 'name' && params.sortOrder === 'desc'}
              onCheckedChange={() => handleSortChange('name', 'desc')}
            >
              Name (Z-A)
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={params.sortBy === 'size' && params.sortOrder === 'desc'}
              onCheckedChange={() => handleSortChange('size', 'desc')}
            >
              Largest First
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={params.sortBy === 'size' && params.sortOrder === 'asc'}
              onCheckedChange={() => handleSortChange('size', 'asc')}
            >
              Smallest First
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={() => onChange({ page: 1, limit: params.limit })} aria-label="Clear filters">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}