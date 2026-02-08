import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info } from 'lucide-react';

export default function GrokLiveView() {
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to detect if iframe fails to load
    const timeout = setTimeout(() => {
      setEmbedBlocked(true);
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setEmbedBlocked(false);
  };

  const handleIframeError = () => {
    setEmbedBlocked(true);
    setIsLoading(false);
  };

  return (
    <Card className="border-2 border-accent/50 bg-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-accent" />
          Grok (live view)
        </CardTitle>
        <CardDescription>
          Your video generation continues in this app. You can optionally view Grok's interface below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {embedBlocked ? (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="space-y-3">
              <p className="text-sm">
                Grok cannot be embedded directly due to browser security restrictions. Your video generation is still running in the background.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://grok.com', '_blank', 'noopener,noreferrer')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Grok in a new tab
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading Grok...</p>
                </div>
              </div>
            )}
            <iframe
              src="https://grok.com"
              className="absolute inset-0 w-full h-full rounded-lg border-2 border-border"
              title="Grok Live View"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
