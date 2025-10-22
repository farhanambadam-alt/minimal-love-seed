import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FileUploaderProps {
  owner: string;
  repo: string;
  branch: string;
  currentPath: string;
  onClose: () => void;
  onUploadComplete: () => void;
}

export function FileUploader({
  owner,
  repo,
  branch,
  currentPath,
  onClose,
  onUploadComplete,
}: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      setCommitMessage(`Upload ${filesArray.length} file${filesArray.length > 1 ? 's' : ''}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
      setCommitMessage(`Upload ${filesArray.length} file${filesArray.length > 1 ? 's' : ''}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filesData = await Promise.all(
        selectedFiles.map(async (file) => {
          const content = await readFileAsBase64(file);
          const path = currentPath ? `${currentPath}/${file.name}` : file.name;
          return { path, content };
        })
      );

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('upload-files', {
        body: {
          owner,
          repo,
          files: filesData,
          branch,
          message: commitMessage,
          provider_token: session?.provider_token,
        }
      });

      if (error) {
        console.error('Error uploading files:', error);
        toast({
          title: "Upload failed",
          description: "Could not upload files. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.results) {
        const failed = data.results.filter((r: any) => !r.success);
        if (failed.length > 0) {
          toast({
            title: "Partial upload",
            description: `${failed.length} file(s) failed to upload.`,
            variant: "destructive",
          });
        } else {
          onUploadComplete();
        }
      }
    } catch (err) {
      console.error('Exception uploading files:', err);
      toast({
        title: "Error",
        description: "Something went wrong during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl md:text-2xl">Upload Files</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Upload files to your repository</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div
            className="border-2 border-dashed rounded-lg p-10 md:p-12 text-center cursor-pointer hover:border-primary transition-colors touch-manipulation active:scale-[0.99]"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-16 w-16 md:h-14 md:w-14 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base md:text-sm font-medium mb-2">
              Click to browse or drag and drop files
            </p>
            <p className="text-sm md:text-xs text-muted-foreground">
              Upload multiple files at once
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Selected Files ({selectedFiles.length})</Label>
              <div className="max-h-[250px] md:max-h-[200px] overflow-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 md:p-2 bg-muted rounded-lg"
                  >
                    <span className="text-base md:text-sm truncate flex-1">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="h-10 w-10 md:h-8 md:w-8 touch-manipulation"
                    >
                      <X className="h-5 w-5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="commit-message" className="text-base font-semibold">Commit Message</Label>
            <Input
              id="commit-message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Upload files..."
              disabled={isUploading}
              className="h-12 md:h-10 text-base md:text-sm"
            />
          </div>

          {isUploading && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Uploading...</Label>
              <Progress value={uploadProgress} className="h-3" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isUploading}
            className="h-12 md:h-10 text-base md:text-sm min-w-[100px] touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="h-12 md:h-10 text-base md:text-sm min-w-[120px] touch-manipulation"
          >
            {isUploading && <Loader2 className="h-5 w-5 md:h-4 md:w-4 mr-2 animate-spin" />}
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
