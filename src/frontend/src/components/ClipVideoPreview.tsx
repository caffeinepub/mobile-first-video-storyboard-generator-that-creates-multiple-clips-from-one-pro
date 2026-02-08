import { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ClipVideoPreviewProps {
  url: string;
  onRetry: () => void;
  className?: string;
}

export default function ClipVideoPreview({ url, onRetry, className = '' }: ClipVideoPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset error state when URL changes
  useEffect(() => {
    setHasError(false);
    setIsRetrying(false);
  }, [url]);

  const handleError = () => {
    // Only set error if we're not already in error state (prevent spam)
    if (!hasError) {
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setHasError(false);
    onRetry();
  };

  // If there's an error, show error UI
  if (hasError) {
    return (
      <div className={`rounded-lg overflow-hidden bg-muted border-2 border-destructive/50 ${className}`}>
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Unable to load video preview. The video URL may be invalid or the file may not be accessible.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            Retry Clip
          </Button>
        </div>
      </div>
    );
  }

  // Otherwise, show video player
  return (
    <div className={`rounded-lg overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full"
        preload="metadata"
        onError={handleError}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}
