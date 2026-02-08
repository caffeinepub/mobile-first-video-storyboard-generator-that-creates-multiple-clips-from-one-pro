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

interface ClipSegmentsListProps {
  segments: PublicSegment[];
  clips: ClipData[];
  onRetry: (index: number) => void;
  generationError?: string | null;
  onBackToPrompt?: () => void;
}

export default function ClipSegmentsList({ 
  segments, 
  clips, 
  onRetry,
  generationError,
  onBackToPrompt
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

  // Show error state if generation failed before segments were created
  if (generationError && segments.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-3xl font-display font-bold tracking-tight">
            Generation Failed
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Unable to start video generation
          </p>
        </div>

        <Card className="border-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                The video generation service encountered an error. This is usually caused by incorrect configuration or network issues.
              </AlertDescription>
            </Alert>

            <Collapsible open={showTechnicalDetails} onOpenChange={setShowTechnicalDetails}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Show technical details
                  </span>
                  {showTechnicalDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="p-3 rounded-lg bg-muted border text-xs font-mono break-all whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {generationError}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-col gap-2 pt-2">
              <p className="text-sm font-medium text-muted-foreground">
                To resolve this issue:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Verify your Grok endpoint is set to <code className="text-xs bg-muted px-1 py-0.5 rounded">https://api.x.ai/v1</code></li>
                <li>Check that your API key is correct and has not expired</li>
                <li>Verify your prompt and settings are valid</li>
                <li>If using reference images, try removing them or using different images</li>
                <li>Try again with different settings</li>
              </ul>
            </div>

            {onBackToPrompt && (
              <Button 
                onClick={onBackToPrompt}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Prompt
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Film className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold tracking-tight">
          Generating Clips
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your video clips are being created
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>{label}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {segments.map((segment, index) => {
          const clip = clips[index];
          const isFailed = segment.status.__kind__ === 'failed';
          const isCompleted = segment.status.__kind__ === 'completed';

          return (
            <Card 
              key={index}
              className={`border-2 transition-all ${
                isFailed ? 'border-destructive/50' : 
                isCompleted ? 'border-primary/50' : 
                'border-border'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(segment.status)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-1">
                        Clip {index + 1}
                      </CardTitle>
                      <CardDescription className="text-sm break-words">
                        {segment.prompt}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(segment.status)}
                </div>
              </CardHeader>

              {isFailed && (
                <CardContent className="space-y-3">
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      {segment.status.__kind__ === 'failed' && typeof segment.status.failed === 'string'
                        ? segment.status.failed 
                        : 'Failed to generate clip'}
                    </AlertDescription>
                  </Alert>
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

              {isCompleted && clip && (
                <CardContent>
                  <ClipVideoPreview
                    url={clip.url}
                    onRetry={() => onRetry(index)}
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
