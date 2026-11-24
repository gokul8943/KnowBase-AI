import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { MoreHorizontal, Download, Eye, Trash2, FileText, Table as TableIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../../../components/ui/dropdown-menu';
import { useDeleteDocument } from '../hooks/useDocuments';
import { documentApi } from '../api/documentApi';
import type { DocumentResponse } from '../types/document';
import { STATUS_LABELS, FILE_TYPE_LABELS, formatFileSize } from '../types/document';

interface DocumentCardProps {
  document: DocumentResponse;
  onViewDetails?: (document: DocumentResponse) => void;
}

const statusVariants = {
  PENDING: 'warning' as const,
  UPLOADING: 'info' as const,
  UPLOADED: 'success' as const,
  FAILED: 'destructive' as const,
  DELETING: 'warning' as const,
  DELETED: 'secondary' as const,
};

export function DocumentCard({ document, onViewDetails }: DocumentCardProps) {
  const deleteMutation = useDeleteDocument();

  const handleDownload = async (doc: DocumentResponse) => {
    const data = await documentApi.download(doc.id);
    if (data?.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
    }
  };

  const handlePreview = async (doc: DocumentResponse) => {
    const data = await documentApi.preview(doc.id);
    if (data?.previewUrl) {
      window.open(data.previewUrl, '_blank');
    }
  };

  const handleDelete = (doc: DocumentResponse) => {
    if (confirm(`Are you sure you want to delete "${doc.originalName}"?`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-8 w-8 text-gray-500" />;
      case 'csv':
        return <TableIcon className="h-8 w-8 text-green-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Card className="flex flex-col h-full transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col h-full p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {getFileIcon(document.extension)}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate" title={document.originalName}>{document.originalName}</h3>
              <p className="text-sm text-muted-foreground">
                {FILE_TYPE_LABELS[document.extension as keyof typeof FILE_TYPE_LABELS] || document.extension.toUpperCase()}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewDetails?.(document)} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePreview(document)} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload(document)} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(document)}
                className="flex items-center gap-2 text-destructive"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 space-y-2 text-sm text-muted-foreground mt-auto">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            <span>{formatFileSize(BigInt(document.size))}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 flex items-center justify-center">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span>{document.uploadedBy?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 flex items-center justify-center">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span>{format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-3">
        <Badge variant={statusVariants[document.status]} className="gap-1">
          {STATUS_LABELS[document.status]}
        </Badge>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onViewDetails?.(document)} aria-label="View details">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handlePreview(document)} aria-label="Preview">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}