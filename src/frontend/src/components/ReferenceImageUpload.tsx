import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Image, Upload, X, AlertCircle } from 'lucide-react';
import {
  isValidImageFile,
  formatFileSize,
  formatFileName,
  createPreviewUrl,
  revokePreviewUrl,
  MAX_REFERENCE_IMAGES,
  type ReferenceImageFile
} from '../lib/referenceImages';

interface ReferenceImageUploadProps {
  images: ReferenceImageFile[];
  onImagesChange: (images: ReferenceImageFile[]) => void;
}

export default function ReferenceImageUpload({
  images,
  onImagesChange
}: ReferenceImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError(null);

    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > MAX_REFERENCE_IMAGES) {
      setError(`You can only upload up to ${MAX_REFERENCE_IMAGES} reference images.`);
      return;
    }

    const newImages: ReferenceImageFile[] = [];
    let hasError = false;

    for (const file of files) {
      const validation = isValidImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        hasError = true;
        break;
      }

      const previewUrl = createPreviewUrl(file);
      newImages.push({
        file,
        previewUrl,
        id: `${Date.now()}-${Math.random()}`
      });
    }

    if (!hasError && newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      revokePreviewUrl(imageToRemove.previewUrl);
    }
    onImagesChange(images.filter(img => img.id !== id));
    setError(null);
  };

  const handleClearAll = () => {
    images.forEach(img => revokePreviewUrl(img.previewUrl));
    onImagesChange([]);
    setError(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          Reference Images
          <Badge variant="secondary" className="ml-auto">
            Optional
          </Badge>
        </CardTitle>
        <CardDescription>
          Upload images of people or scenes to guide the AI generation (up to {MAX_REFERENCE_IMAGES} images)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {images.length === 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            className="w-full h-32 border-dashed border-2 hover:border-primary hover:bg-primary/5"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm font-medium">Upload Reference Images</span>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF (max 10MB each)
              </span>
            </div>
          </Button>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group rounded-lg overflow-hidden border-2 border-border bg-muted aspect-square"
                >
                  <img
                    src={image.previewUrl}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <p className="text-white text-xs font-medium text-center break-all">
                      {formatFileName(image.file.name, 20)}
                    </p>
                    <p className="text-white/80 text-xs">
                      {formatFileSize(image.file.size)}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveImage(image.id)}
                      className="mt-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {images.length < MAX_REFERENCE_IMAGES && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add More
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleClearAll}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
