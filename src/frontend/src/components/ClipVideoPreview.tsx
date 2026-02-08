import { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface ClipVideoPreviewProps {
  url: string;
  onRetry: () => void;
  className?: string;
}

type PreviewState = 'loading' | 'ready' | 'error';

export default function ClipVideoPreview({ url, onRetry, className = '' }: ClipVideoPreviewProps) {
  const [previewState, setPreviewState] = useState<PreviewState>('loading');
  const [isRetrying, setIsRetrying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset state when URL changes
  useEffect(() => {
    setPreviewState('loading');
    setIsRetrying(false);
  }, [url]);

  // Validate URL before attempting to render
  const isValidUrl = url && url.trim() !== '' && 
    (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:'));

  const handleLoadedMetadata = () => {
    setPreviewState('ready');
  };

  const handleError = () => {
    // Hide the video element immediately to prevent native error UI
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
    }
    setPreviewState('error');
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setPreviewState('loading');
    onRetry();
  };

  // Don't render video element for empty/invalid URLs
  if (!isValidUrl) {
    return (
      <div className={`rounded-lg overflow-hidden bg-muted border-2 border-muted-foreground/20 ${className}`}>
        <div className="p-6 space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Video preview not available. The clip may still be generating or failed to generate.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show error UI (no video element)
  if (previewState === 'error') {
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

  // Show loading state
  if (previewState === 'loading') {
    return (
      <div className={`rounded-lg overflow-hidden bg-black ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
        {/* Hidden video element for loading */}
        <video
          ref={videoRef}
          src={url}
          className="hidden"
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
        />
      </div>
    );
  }

  // Show video player (ready state)
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
