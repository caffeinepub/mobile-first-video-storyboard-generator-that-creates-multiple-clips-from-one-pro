import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Play, AlertCircle, CheckCircle2, Film } from 'lucide-react';
import { composeVideos, canCompose } from '../lib/videoCompose';
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
  const [error, setError] = useState<string | null>(null);
  const compositionSupported = canCompose();

  useEffect(() => {
    if (isComposing && !composedVideoUrl && clips.length > 0) {
      handleCompose();
    }
  }, [isComposing, composedVideoUrl, clips]);

  const handleCompose = async () => {
    if (!compositionSupported) {
      setError('Video composition is not supported in this browser. You can download individual clips below.');
      return;
    }

    setComposing(true);
    setError(null);
    setProgress(0);

    try {
      const videoUrl = await composeVideos(clips, (p) => setProgress(p));
      onComposed(videoUrl);
      toast.success('Video composed successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compose video';
      setError(message);
      toast.error(message);
    } finally {
      setComposing(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started!');
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
            {clips.length === 1 ? 'Preparing your clip...' : 'Stitching your clips together...'}
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {Math.round(progress)}% complete
              </p>
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
          {clips.length === 1 ? 'Preview and download your clip' : 'Preview and download your composed video'}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {composedVideoUrl && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {clips.length === 1 ? 'Your Clip' : 'Final Video'}
            </CardTitle>
            <CardDescription>
              {clips.length === 1 ? 'Your generated video clip' : 'Your complete video'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg overflow-hidden border-2 border-border bg-black">
              <video
                src={composedVideoUrl}
                controls
                className="w-full"
                playsInline
              />
            </div>
            <Button
              onClick={() => handleDownload(composedVideoUrl, clips.length === 1 ? 'video-clip.mp4' : 'composed-video.mp4')}
              className="w-full"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </Button>
          </CardContent>
        </Card>
      )}

      {clips.length > 1 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Individual Clips</CardTitle>
            <CardDescription>
              Download clips separately if needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {clips.map((clip, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {clip.thumbnailUrl && (
                    <img
                      src={clip.thumbnailUrl}
                      alt={`Clip ${index + 1}`}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">Clip {index + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      {clip.duration}s
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(clip.url, `clip-${index + 1}.mp4`)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
