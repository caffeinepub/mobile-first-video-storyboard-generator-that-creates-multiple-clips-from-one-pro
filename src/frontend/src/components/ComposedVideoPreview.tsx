import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Play, AlertCircle, CheckCircle2, Film, Info, RefreshCw } from 'lucide-react';
import { composeVideos, canCompose, getCompositionCapabilityMessage } from '../lib/videoCompose';
import { downloadVideo } from '../lib/download';
import type { ClipData } from '../providers/videoProvider';
import { toast } from 'sonner';

interface ComposedVideoPreviewProps {
  clips: ClipData[];
  composedVideoUrl: string | null;
  onComposed: (url: string) => void;
  isComposing: boolean;
}

export default function ComposedVideoPreview({
  clips,
  composedVideoUrl,
  onComposed,
  isComposing
}: ComposedVideoPreviewProps) {
  const [composing, setComposing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const compositionSupported = canCompose();
  const capabilityMessage = getCompositionCapabilityMessage(clips.length);

  useEffect(() => {
    if (isComposing && !composedVideoUrl && clips.length > 0) {
      handleCompose();
    }
  }, [isComposing, composedVideoUrl, clips]);

  // Reset video load error when URL changes
  useEffect(() => {
    setVideoLoadError(false);
  }, [composedVideoUrl]);

  const handleCompose = async () => {
    if (!compositionSupported) {
      setError('Video composition is not supported in this browser. You can download individual clips below.');
      onComposed(clips[0]?.url || '');
      return;
    }

    setComposing(true);
    setError(null);
    setProgress(0);
    setStage('Starting...');

    try {
      const videoUrl = await composeVideos(clips, (p, s) => {
        setProgress(p);
        if (s) setStage(s);
      });
      onComposed(videoUrl);
      toast.success('Video ready!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compose video';
      setError(message);
      toast.error(message);
      // Still allow individual clip downloads
      if (clips.length > 0) {
        onComposed(clips[0].url);
      }
    } finally {
      setComposing(false);
      setStage('');
    }
  };

  const handleDownload = async (url: string, filename: string, clipIndex?: number) => {
    if (clipIndex !== undefined) {
      setDownloading(clipIndex);
    }

    const result = await downloadVideo(url, filename);
    
    if (clipIndex !== undefined) {
      setDownloading(null);
    }

    if (result.success) {
      toast.success('Download started!');
    } else {
      toast.error(result.error || 'Download failed');
    }
  };

  const handleVideoError = () => {
    setVideoLoadError(true);
  };

  const handleRetryCompose = () => {
    setError(null);
    setVideoLoadError(false);
    handleCompose();
  };

  if (composing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse-glow">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold tracking-tight">
            Composing Video
          </h2>
          <p className="text-muted-foreground">
            {clips.length === 1 ? 'Preparing your clip...' : 'Preparing your video...'}
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Progress value={progress} className="h-3" />
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
                {stage && (
                  <p className="text-xs text-muted-foreground">
                    {stage}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold tracking-tight">
          Your Video is Ready!
        </h2>
        <p className="text-muted-foreground">
          {clips.length === 1 ? 'Preview and download your clip' : 'Preview and download your video'}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            {compositionSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryCompose}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Composition
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {capabilityMessage && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>{capabilityMessage}</AlertDescription>
        </Alert>
      )}

      {composedVideoUrl && composedVideoUrl.trim() !== '' && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {clips.length === 1 ? 'Your Clip' : 'Video Preview'}
            </CardTitle>
            <CardDescription>
              {clips.length === 1 ? 'Your generated video clip' : 'Preview of the first clip'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoLoadError ? (
              <div className="rounded-lg overflow-hidden border-2 border-destructive/50 bg-muted p-6">
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="space-y-3">
                    <p className="text-sm">
                      Unable to load the composed video preview. The video file may be corrupted or inaccessible.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryCompose}
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Composition
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        You can still download individual clips below
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <>
                <div className="rounded-lg overflow-hidden border-2 border-border bg-black">
                  <video
                    src={composedVideoUrl}
                    controls
                    className="w-full"
                    playsInline
                    preload="metadata"
                    onError={handleVideoError}
                  />
                </div>
                <Button
                  onClick={() => handleDownload(composedVideoUrl, clips.length === 1 ? 'video-clip.webm' : 'video-preview.webm')}
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {clips.length === 1 ? 'Download Video' : 'Download Preview'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {clips.length > 1 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Individual Clips</CardTitle>
            <CardDescription>
              Download each clip separately
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {clips.map((clip, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {clip.url && clip.url.trim() !== '' && (
                    <video
                      src={clip.url}
                      className="w-16 h-16 rounded object-cover bg-black"
                      preload="metadata"
                      muted
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Clip {index + 1}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {clip.duration}s · {clip.prompt.substring(0, 40)}...
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(clip.url, `clip-${index + 1}.webm`, index)}
                  disabled={downloading === index || !clip.url || clip.url.trim() === ''}
                >
                  <Download className="w-3 h-3 mr-1" />
                  {downloading === index ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
