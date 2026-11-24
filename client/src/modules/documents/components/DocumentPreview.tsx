import { useRef, useState } from 'react';
import { X, Download, ExternalLink, FileText, Table as TableIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { PreviewResponse } from '../types/document';
import { FILE_TYPE_LABELS } from '../types/document';

interface DocumentPreviewProps {
  previewData: PreviewResponse | null;
  isLoading: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export function DocumentPreview({ previewData, isLoading, onClose, onDownload }: DocumentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  if (!previewData && !isLoading) {
    return null;
  }

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'csv':
        return <TableIcon className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const canPreviewInline = previewData?.extension === 'pdf' || previewData?.extension === 'txt' || previewData?.extension === 'md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div 
        className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-background rounded-xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              {previewData && getFileIcon(previewData.extension)}
            </div>
            <div>
              <CardTitle className="text-lg truncate max-w-[300px]">{previewData?.filename || 'Document Preview'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {FILE_TYPE_LABELS[previewData?.extension as keyof typeof FILE_TYPE_LABELS] || previewData?.extension?.toUpperCase()}
                {previewData && ` • ${formatFileSize(BigInt(previewData.size))}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {previewData && (
              <>
                <Button variant="ghost" size="icon" onClick={() => window.open(previewData.previewUrl, '_blank')} aria-label="Open in new tab">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDownload} aria-label="Download">
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close preview">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10 p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Unable to Preview</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={onDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download Instead
              </Button>
            </div>
          )}

          {previewData && canPreviewInline && !error && (
            <iframe
              ref={iframeRef}
              src={previewData.previewUrl}
              className="w-full h-full border-0"
              onError={() => setError('Failed to load preview')}
              title={previewData.filename}
              sandbox="allow-scripts allow-same-origin"
            />
          )}

          {previewData && !canPreviewInline && !error && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center mb-6">
                {getFileIcon(previewData.extension)}
              </div>
              <h3 className="text-xl font-medium mb-2">Preview Not Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Inline preview is not supported for {FILE_TYPE_LABELS[previewData.extension as keyof typeof FILE_TYPE_LABELS] || previewData.extension} files.
                You can download the file to view it locally.
              </p>
              <div className="flex gap-3">
                <Button onClick={onDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download File
                </Button>
                <Button variant="outline" onClick={() => window.open(previewData.previewUrl, '_blank')} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}

function formatFileSize(bytes: bigint): string {
  const size = Number(bytes);
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}