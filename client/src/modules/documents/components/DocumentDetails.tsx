import { useState } from 'react';
import { format } from 'date-fns';
import { X, Download, Eye, Trash2, Edit2, Copy, FileText, Table as TableIcon, Shield, User } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Separator } from '../../../components/ui/separator';
import { useDeleteDocument } from '../hooks/useDocuments';
import { useUpdateDocument } from '../hooks/useDocuments';
import { documentApi } from '../api/documentApi';
import type { DocumentResponse } from '../types/document';
import { STATUS_LABELS, FILE_TYPE_LABELS, formatFileSize } from '../types/document';

const STATUS_VARIANTS = {
  PENDING: 'warning' as const,
  UPLOADING: 'info' as const,
  UPLOADED: 'success' as const,
  FAILED: 'destructive' as const,
  DELETING: 'warning' as const,
  DELETED: 'secondary' as const,
};

interface DocumentDetailsProps {
  document: DocumentResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  currentUserId: string;
}

export function DocumentDetails({ document, isOpen, onClose, onRefresh, userRole, currentUserId }: DocumentDetailsProps) {
  const deleteMutation = useDeleteDocument();
  const updateMutation = useUpdateDocument();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const canDelete = userRole === 'OWNER' || userRole === 'ADMIN' || document?.uploadedById === currentUserId;
  const canEdit = userRole === 'OWNER' || userRole === 'ADMIN' || document?.uploadedById === currentUserId;

  const handleDownload = async () => {
    if (!document) return;
    const data = await documentApi.download(document.id);
    if (data?.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
    }
  };

  const handlePreview = async () => {
    if (!document) return;
    const data = await documentApi.preview(document.id);
    if (data?.previewUrl) {
      window.open(data.previewUrl, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    if (confirm(`Are you sure you want to delete "${document?.originalName}"? This action cannot be undone.`)) {
      await deleteMutation.mutateAsync(document!.id);
      onRefresh();
      onClose();
    }
  };

  const handleEditSave = async () => {
    if (!document) return;
    if (editName.trim() && editName !== document?.name) {
      await updateMutation.mutateAsync({ documentId: document!.id, name: editName.trim() });
      onRefresh();
      setIsEditing(false);
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

  if (!document) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              {getFileIcon(document.extension)}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl truncate">{document.originalName}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {FILE_TYPE_LABELS[document.extension as keyof typeof FILE_TYPE_LABELS] || document.extension.toUpperCase()}
                {' • '}
                {formatFileSize(BigInt(document.size))}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <Card className="border-0 shadow-none mt-4">
          <CardContent className="space-y-6 pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">File Name</Label>
                {isEditing ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                    onBlur={handleEditSave}
                    autoFocus
                  />
                ) : (
                  <p className="font-medium">{document.name}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Original Name</Label>
                <p>{document.originalName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">File Type</Label>
                <Badge variant="secondary" className="gap-1">
                  {FILE_TYPE_LABELS[document.extension as keyof typeof FILE_TYPE_LABELS] || document.extension.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">MIME Type</Label>
                <p className="font-mono text-sm">{document.mimeType}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">File Size</Label>
                <p>{formatFileSize(BigInt(document.size))}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Checksum (SHA-256)</Label>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm text-muted-foreground flex-1 break-all">{document.checksum}</code>
                  <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(document.checksum)} aria-label="Copy checksum">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Status</Label>
                <Badge variant={STATUS_VARIANTS[document.status]}>
                  {STATUS_LABELS[document.status]}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Uploaded By</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{document.uploadedBy?.name || 'Unknown'}</span>
                  {document.uploadedById === currentUserId && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      You
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Upload Date</Label>
                <p>{format(new Date(document.createdAt), 'PPpp')}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Last Updated</Label>
                <p>{format(new Date(document.updatedAt), 'PPpp')}</p>
              </div>
            </div>

            {document.errorMessage && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <strong>Error:</strong> {document.errorMessage}
              </div>
            )}

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePreview} className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              {canEdit && (
                <Button variant="outline" onClick={() => { setEditName(document.name); setIsEditing(true); }} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Rename
                </Button>
              )}
              {canDelete && (
                <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="gap-2 ml-auto">
                  <Trash2 className="h-4 w-4" />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}