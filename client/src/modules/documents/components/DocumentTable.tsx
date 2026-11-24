import { forwardRef } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { MoreHorizontal, Download, Eye, Trash2, FileText, Table as TableIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../../../components/ui/dropdown-menu';
import { useDeleteDocument } from '../hooks/useDocuments';
import { documentApi } from '../api/documentApi';
import type { DocumentResponse, DocumentStatus } from '../types/document';
import { STATUS_LABELS, FILE_TYPE_LABELS } from '../types/document';

const statusVariants: Record<DocumentStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'warning',
  UPLOADING: 'info',
  UPLOADED: 'success',
  FAILED: 'destructive',
  DELETING: 'warning',
  DELETED: 'secondary',
};

interface DocumentTableProps {
  documents: DocumentResponse[];
  onViewDetails?: (document: DocumentResponse) => void;
}

export const DocumentTable = forwardRef<HTMLTableElement, DocumentTableProps>(({ documents, onViewDetails }, ref) => {
  const deleteMutation = useDeleteDocument();

  const handleDownload = async (document: DocumentResponse) => {
    const data = await documentApi.download(document.id);
    if (data?.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
    }
  };

  const handlePreview = async (document: DocumentResponse) => {
    const data = await documentApi.preview(document.id);
    if (data?.previewUrl) {
      window.open(data.previewUrl, '_blank');
    }
  };

  const handleDelete = (document: DocumentResponse) => {
    if (confirm(`Are you sure you want to delete "${document.originalName}"?`)) {
      deleteMutation.mutate(document.id);
    }
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'csv':
        return <TableIcon className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <Table ref={ref}>
        <TableCaption className="sr-only">Documents</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">File</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell w-32">Type</TableHead>
            <TableHead className="hidden lg:table-cell w-24">Size</TableHead>
            <TableHead className="hidden lg:table-cell w-32">Uploaded By</TableHead>
            <TableHead className="hidden md:table-cell w-24">Date</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="flex items-center justify-center">
                {getFileIcon(document.extension)}
              </TableCell>
              <TableCell className="font-medium max-w-xs truncate" title={document.originalName}>
                {document.originalName}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary" className="gap-1">
                  {FILE_TYPE_LABELS[document.extension as keyof typeof FILE_TYPE_LABELS] || document.extension.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                {formatFileSize(BigInt(document.size))}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                {document.uploadedBy?.name || 'Unknown'}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                {format(new Date(document.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[document.status]}>
                  {STATUS_LABELS[document.status]}
                </Badge>
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

DocumentTable.displayName = 'DocumentTable';

export function formatFileSize(bytes: bigint): string {
  const size = Number(bytes);
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}