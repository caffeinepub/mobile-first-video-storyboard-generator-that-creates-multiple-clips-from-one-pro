import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Film, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { PublicSegment } from '../backend';
import type { ClipData } from '../providers/videoProvider';
import { useLiveGenerationProgress } from '../hooks/useLiveGenerationProgress';
import ClipVideoPreview from './ClipVideoPreview';
import GrokLiveView from './GrokLiveView';

interface ClipSegmentsListProps {
  segments: PublicSegment[];
  clips: (ClipData | null)[];
  onRetry: (index: number) => void;
  generationError?: string | null;
  onBackToPrompt?: () => void;
  onTryAgain?: () => void;
}

export default function ClipSegmentsList({ 
  segments, 
  clips, 
  onRetry,
  generationError,
  onBackToPrompt,
  onTryAgain
}: ClipSegmentsListProps) {
  const { progress, label } = useLiveGenerationProgress(segments);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const getStatusIcon = (status: PublicSegment['status']) => {
    switch (status.__kind__) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'generating':
        return <Clock className="w-5 h-5 text-accent animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'queued':
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: PublicSegment['status']) => {
    switch (status.__kind__) {
      case 'completed':
        return <Badge variant="outline" className="border-primary text-primary">Completed</Badge>;
      case 'generating':
        return <Badge variant="outline" className="border-accent text-accent">Generating...</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-destructive text-destructive">Failed</Badge>;
      case 'queued':
      default:
        return <Badge variant="outline" className="text-muted-foreground">Queued</Badge>;
    }
  };

  // Check if generation is in progress
  const isGenerating = segments.some(s => 
    s.status.__kind__ === 'generating' || s.status.__kind__ === 'queued'
  );

  // Show error state if generation failed before segments were created
  if (generationError && segments.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Generation Failed</CardTitle>
                <CardDescription>Unable to start video generation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                {generationError}
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              {onBackToPrompt && (
                <Button variant="outline" onClick={onBackToPrompt} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Prompt
                </Button>
              )}
              {onTryAgain && (
                <Button onClick={onTryAgain} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Film className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Generating Clips</CardTitle>
              <CardDescription>Your video clips are being created</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{label}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-right text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grok Live View - only show while generating */}
      {isGenerating && <GrokLiveView />}

      {/* Clip Segments */}
      <div className="space-y-4">
        {segments.map((segment, index) => {
          const clip = clips[index];
          const isFailed = segment.status.__kind__ === 'failed';
          const isCompleted = segment.status.__kind__ === 'completed';
          const hasValidClip = clip && clip.url && clip.url.trim() !== '';

          return (
            <Card 
              key={index}
              className={isFailed ? 'border-destructive/50' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(segment.status)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">Clip {index + 1}</CardTitle>
                      <CardDescription className="break-words">
                        {segment.prompt}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(segment.status)}
                </div>
              </CardHeader>

              {/* Show error details for failed clips */}
              {isFailed && (
                <CardContent className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      {segment.status.__kind__ === 'failed' && segment.status.failed
                        ? (() => {
                            const errorMsg = segment.status.failed;
                            // Extract user-friendly message (before technical details)
                            const match = errorMsg.match(/^([^(]+?)(?:\s*\(|$)/);
                            const userMessage = match ? match[1].trim() : errorMsg;
                            
                            // Check if reference images were mentioned
                            const hasReferenceImageNote = errorMsg.includes('reference image');
                            
                            return (
                              <div className="space-y-2">
                                <p>{userMessage}</p>
                                {hasReferenceImageNote && (
                                  <p className="text-xs">
                                    Try generating without reference images if the issue persists.
                                  </p>
                                )}
                              </div>
                            );
                          })()
                        : 'Generation failed'}
                    </AlertDescription>
                  </Alert>

                  {/* Technical details collapsible */}
                  {segment.status.__kind__ === 'failed' && segment.status.failed && (
                    <Collapsible open={showTechnicalDetails} onOpenChange={setShowTechnicalDetails}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between">
                          <span className="text-xs text-muted-foreground">Technical Details</span>
                          {showTechnicalDetails ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 rounded-md bg-muted text-xs font-mono break-all">
                          {segment.status.failed}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(index)}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Clip
                  </Button>
                </CardContent>
              )}

              {/* Show preview for completed clips with valid URLs */}
              {isCompleted && hasValidClip && (
                <CardContent>
                  <ClipVideoPreview
                    url={clip.url}
                    onRetry={() => onRetry(index)}
                    className="w-full"
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
