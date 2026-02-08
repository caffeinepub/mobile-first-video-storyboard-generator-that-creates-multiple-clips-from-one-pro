import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Film } from 'lucide-react';
import type { PublicSegment } from '../backend';
import type { ClipData } from '../providers/videoProvider';

interface ClipSegmentsListProps {
  segments: PublicSegment[];
  clips: ClipData[];
  onRetry: (index: number) => void;
}

export default function ClipSegmentsList({ segments, clips, onRetry }: ClipSegmentsListProps) {
  const completedCount = segments.filter(s => s.status.__kind__ === 'completed').length;
  const progress = (completedCount / segments.length) * 100;

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Film className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold tracking-tight">
          Generating {segments.length === 1 ? 'Clip' : 'Clips'}
        </h2>
        <p className="text-muted-foreground">
          {completedCount} of {segments.length} {segments.length === 1 ? 'clip' : 'clips'} completed
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {segments.length === 1 ? 'Your clip is being generated' : 'Each clip is being generated independently'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% complete
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {segments.map((segment, index) => (
          <Card key={index} className="border-2 transition-all hover:shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(segment.status)}
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Clip {index + 1}
                        </span>
                        {getStatusBadge(segment.status)}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {segment.prompt}
                      </p>
                    </div>
                  </div>

                  {segment.status.__kind__ === 'failed' && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription className="flex items-center justify-between">
                        <span className="text-sm">
                          {segment.status.failed}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRetry(index)}
                          className="ml-2"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {segment.status.__kind__ === 'completed' && clips[index]?.thumbnailUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border">
                      <img
                        src={clips[index].thumbnailUrl}
                        alt={`Clip ${index + 1} preview`}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
