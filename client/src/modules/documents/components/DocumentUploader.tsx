import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Table as TableIcon, AlertCircle, CheckCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { SUPPORTED_EXTENSIONS, FILE_TYPE_LABELS, formatFileSize } from '../types/document';
import type { FileWithProgress } from '../types/document';

interface DocumentUploaderProps {
  onUploadComplete?: () => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.markdown'],
  'text/csv': ['.csv'],
};

export function DocumentUploader({ onUploadComplete, maxFiles = 5, maxSizeMB = 20 }: DocumentUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dropzoneInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const { files, isUploading, addFiles, removeFile, clearFiles, startUpload, retryFile, canUpload, error } = useDocumentUpload({
    onSuccess: () => {
      clearFiles();
      onUploadComplete?.();
    },
    onError: (err) => {
      console.error('Upload failed:', err);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !SUPPORTED_EXTENSIONS.includes(extension as any)) {
          return false;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          return false;
        }
        return true;
      });

      if (validFiles.length !== acceptedFiles.length) {
        // Some files were rejected
      }

      if (files.length + validFiles.length > maxFiles) {
        // Would exceed max files
        return;
      }

      addFiles(validFiles);
    },
    [files.length, maxFiles, maxSizeMB, addFiles]
  );

  // Persistent file input handler for "Add More" button
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onDrop(Array.from(e.target.files));
      e.target.value = '';
    }
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: ACCEPTED_TYPES,
    maxFiles: maxFiles - files.length,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: isUploading,
    noClick: false,
    noKeyboard: false,
    noDrag: false,
  });

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
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Render the dropzone area - works in both empty and with-files states
  const renderDropzone = () => (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed transition-colors rounded-xl ${
        isDragActive ? 'border-primary bg-primary/5' : isDragReject ? 'border-destructive bg-destructive/5' : 'border-border'
      }`}
      role="button"
      tabIndex={0}
      style={{ pointerEvents: 'auto' }}
    >
      <input {...getInputProps()} ref={dropzoneInputRef} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', top: 0, left: 0, zIndex: 10 }} />
      <div className="py-12 text-center relative z-0">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Drop files here or click to browse</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Support for PDF, DOCX, TXT, MD, CSV files up to {maxSizeMB}MB each. Maximum {maxFiles} files per upload.
        </p>
      </div>
    </div>
  );

  if (files.length === 0 && !isUploading) {
    return renderDropzone();
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFiles} disabled={isUploading}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Dropzone area - always visible for drag & drop and click to browse */}
        {renderDropzone()}

        <ScrollArea className="max-h-[400px] mt-4">
          <div className="space-y-3">
            {files.map((fileItem) => (
              <div key={fileItem.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center h-10 w-10 rounded bg-background">
                  {getFileIcon(fileItem.file.name.split('.').pop()?.toLowerCase() || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileItem.file.name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="gap-1">
                      {FILE_TYPE_LABELS[fileItem.file.name.split('.').pop()?.toLowerCase() as keyof typeof FILE_TYPE_LABELS] || 'FILE'}
                    </Badge>
                    <span>{formatFileSize(BigInt(fileItem.file.size))}</span>
                  </div>
                  {fileItem.status === 'uploading' && (
                    <Progress value={fileItem.progress} className="mt-2 h-1.5" />
                  )}
                  {fileItem.status === 'error' && (
                    <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fileItem.error || 'Upload failed'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {fileItem.status === 'pending' || fileItem.status === 'error' ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => (fileItem.status === 'error' ? retryFile(fileItem.id) : removeFile(fileItem.id))}
                      disabled={isUploading}
                      aria-label={fileItem.status === 'error' ? 'Retry' : 'Remove'}
                    >
                      {fileItem.status === 'error' ? (
                        <Loader2 className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    getStatusIcon(fileItem.status)
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="mr-2 h-4 w-4 inline" />
            {error.message}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => addMoreInputRef.current?.click()} 
            disabled={isUploading || files.length >= maxFiles}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add More
          </Button>
          <Button onClick={startUpload} disabled={!canUpload || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {files.filter((f) => f.status === 'pending' || f.status === 'error').length} File(s)
              </>
            )}
          </Button>
        </div>

        {/* Persistent hidden file input for "Add More" button */}
        <input
          type="file"
          ref={addMoreInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept=".pdf,.docx,.txt,.md,.csv"
          multiple
        />
      </CardContent>
    </Card>
  );
}