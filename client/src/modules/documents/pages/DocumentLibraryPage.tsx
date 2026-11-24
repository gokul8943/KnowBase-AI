import { useState, useMemo } from 'react';
import { useOrganization } from '../../../context/OrganizationContext';
import { useDocuments, useDocumentStats } from '../hooks/useDocuments';
import { DocumentTable } from '../components/DocumentTable';
import { DocumentCard } from '../components/DocumentCard';
import { DocumentUploader } from '../components/DocumentUploader';
import { DocumentFilters } from '../components/DocumentFilters';
import { DocumentPreview } from '../components/DocumentPreview';
import { DocumentDetails } from '../components/DocumentDetails';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Pagination } from '../../../components/ui/pagination';
import { EmptyState } from '../../../components/ui/empty-state';
import { Loader2, Grid, List, Upload, Download, X } from 'lucide-react';
import type { ListDocumentsParams, DocumentResponse } from '../types/document';
import { formatFileSize } from '../types/document';

export function DocumentLibraryPage() {
  const { activeOrganization } = useOrganization();
  const workspaceId = activeOrganization?.id;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [params, setParams] = useState<ListDocumentsParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ previewUrl: string; filename: string; extension: string; size: string; mimeType: string } | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const { data, isLoading, refetch } = useDocuments(params);
  const { data: stats } = useDocumentStats(workspaceId!);

  const documents = data?.documents || [];
  const pagination = data?.pagination;

  const availableTypes = useMemo(() => {
    const types = new Set(documents.map((d) => d.extension));
    return Array.from(types).sort();
  }, [documents]);

  const handleUploadComplete = () => {
    refetch();
    setShowUploader(false);
  };

  const handleViewDetails = (document: DocumentResponse) => {
    setSelectedDocument(document);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleParamsChange = (newParams: ListDocumentsParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  };

  if (!workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center space-x-2">
            <Upload className="h-6 w-6 text-primary" />
            <span>Documents</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspace documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowUploader(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-3xl font-semibold mt-1">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uploaded</p>
                  <p className="text-3xl font-semibold mt-1 text-green-600">{stats.uploaded}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Badge variant="success" className="text-xs">Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-3xl font-semibold mt-1">{formatFileSize(BigInt(stats.totalSize))}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-3xl font-semibold mt-1 text-red-600">{stats.failed}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <Badge variant="destructive" className="text-xs">Errors</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            {pagination?.total || 0} document{pagination?.total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentFilters
            params={params}
            onChange={handleParamsChange}
            availableTypes={availableTypes}
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<Upload className="h-12 w-12 text-muted-foreground" />}
              title="No documents yet"
              description="Upload your first document to get started."
              action={
                <Button onClick={() => setShowUploader(true)} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              }
            />
          ) : viewMode === 'list' ? (
            <DocumentTable documents={documents} onViewDetails={handleViewDetails} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} onViewDetails={handleViewDetails} />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUploader(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-background rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Upload Documents</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowUploader(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto">
              <DocumentUploader onUploadComplete={handleUploadComplete} />
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <DocumentPreview
          previewData={previewData}
          isLoading={false}
          onClose={handleClosePreview}
        />
      )}

      <DocumentDetails
        document={selectedDocument}
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onRefresh={refetch}
        userRole="MEMBER"
        currentUserId=""
      />
    </div>
  );
}