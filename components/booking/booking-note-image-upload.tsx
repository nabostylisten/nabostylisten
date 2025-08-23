"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/kibo-ui/dropzone";
import { useUploadBookingNoteImages } from "@/hooks/use-upload-booking-note-images";
import { Upload, X, ImageIcon } from "lucide-react";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BookingNoteImageUploadProps {
  bookingId: string;
  noteId: string;
}

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
};

// Helper function to truncate filename
const truncateFilename = (filename: string, maxLength: number = 25): string => {
  if (filename.length <= maxLength) return filename;
  
  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const maxNameLength = maxLength - extension.length - 1; // -1 for the dot
  
  if (nameWithoutExt.length <= maxNameLength) {
    return filename;
  }
  
  return `${nameWithoutExt.substring(0, maxNameLength - 3)}...${extension ? '.' + extension.toLowerCase() : ''}`;
};

export function BookingNoteImageUpload({
  bookingId,
  noteId,
}: BookingNoteImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const uploadMutation = useUploadBookingNoteImages();

  const handleFilesSelected = (acceptedFiles: File[]) => {
    // Add new files to existing selection instead of replacing
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Velg minst ett bilde for å laste opp");
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        bookingId,
        noteId,
        files: selectedFiles,
      });
      
      setSelectedFiles([]);
    } catch (error) {
      // Error is already handled in the mutation
      console.error("Upload error:", error);
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Last opp bilder</h4>
        <p className="text-xs text-muted-foreground">
          Dokumenter resultatet av tjenesten med bilder
        </p>
      </div>

      <Dropzone
        accept={{
          "image/jpeg": [".jpg", ".jpeg"],
          "image/png": [".png"],
          "image/webp": [".webp"],
          "image/gif": [".gif"],
        }}
        maxFiles={10}
        maxSize={10 * 1024 * 1024} // 10MB
        onDrop={handleFilesSelected}
        src={selectedFiles}
        disabled={uploadMutation.isUploading}
      >
        <DropzoneEmptyState>
          <div className="flex flex-col items-center justify-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Upload size={16} />
            </div>
            <p className="my-2 w-full truncate text-wrap font-medium text-sm">
              Last opp bilder
            </p>
            <p className="w-full truncate text-wrap text-muted-foreground text-xs">
              Dra og slipp eller klikk for å velge
            </p>
            <p className="text-wrap text-muted-foreground text-xs">
              Støtter JPEG, PNG, WebP, GIF opptil 10MB
            </p>
          </div>
        </DropzoneEmptyState>
        <DropzoneContent />
      </Dropzone>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Valgte filer ({selectedFiles.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={uploadMutation.isUploading}
            >
              Fjern alle
            </Button>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
            {selectedFiles.map((file, index) => {
              const extension = getFileExtension(file.name);
              const truncatedName = truncateFilename(file.name, 25);
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded border p-2 gap-2"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate" title={file.name}>
                      {truncatedName}
                    </span>
                    {extension && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {extension}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploadMutation.isUploading}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadMutation.isUploading}
          >
            {uploadMutation.isUploading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Laster opp...
              </>
            ) : (
              `Last opp ${selectedFiles.length} bilde${selectedFiles.length > 1 ? 'r' : ''}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}