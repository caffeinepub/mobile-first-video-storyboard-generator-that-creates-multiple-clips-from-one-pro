import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { calculateTotalDuration, isWithinTolerance, getValidationMessage } from '../lib/duration';
import { Sparkles, Clock, Film, AlertCircle, Settings, Check, X, AlertTriangle } from 'lucide-react';
import ReferenceImageUpload from './ReferenceImageUpload';
import type { ReferenceImageFile } from '../lib/referenceImages';
import { saveRuntimeConfig, clearRuntimeConfig, loadRuntimeConfig, hasLegacyEndpoint, getLegacyEndpointMessage } from '../lib/grokRuntimeConfig';
import { isEndpointFormatValid, CANONICAL_GROK_ENDPOINT } from '../lib/grokEndpoint';
import { toast } from 'sonner';

interface PromptComposerProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  clipCount: number;
  onClipCountChange: (value: number) => void;
  perClipDuration: number;
  onPerClipDurationChange: (value: number) => void;
  referenceImages: ReferenceImageFile[];
  onReferenceImagesChange: (images: ReferenceImageFile[]) => void;
  isGrokConfigured: boolean;
}

export default function PromptComposer({
  prompt,
  onPromptChange,
  clipCount,
  onClipCountChange,
  perClipDuration,
  onPerClipDurationChange,
  referenceImages,
  onReferenceImagesChange,
  isGrokConfigured
}: PromptComposerProps) {
  const totalDuration = calculateTotalDuration(clipCount, perClipDuration);
  const withinTolerance = isWithinTolerance(totalDuration, clipCount);
  const validationMessage = getValidationMessage(totalDuration, clipCount);

  const [showRuntimeConfig, setShowRuntimeConfig] = useState(false);
  const [runtimeEndpoint, setRuntimeEndpoint] = useState('');
  const [runtimeApiKey, setRuntimeApiKey] = useState('');
  const [endpointError, setEndpointError] = useState('');

  const legacyEndpoint = hasLegacyEndpoint();
  const legacyMessage = getLegacyEndpointMessage();

  const handleEndpointChange = (value: string) => {
    setRuntimeEndpoint(value);
    // Clear error when user starts typing
    if (endpointError) {
      setEndpointError('');
    }
  };

  const handleSaveRuntimeConfig = () => {
    if (!runtimeEndpoint.trim() || !runtimeApiKey.trim()) {
      toast.error('Both endpoint and API key are required');
      return;
    }

    const result = saveRuntimeConfig(runtimeEndpoint, runtimeApiKey);
    
    if (result.success) {
      toast.success('Grok AI is now active and ready to use');
      setShowRuntimeConfig(false);
      setRuntimeEndpoint('');
      setRuntimeApiKey('');
      setEndpointError('');
    } else {
      setEndpointError(result.error || 'Failed to save configuration');
      toast.error(result.error || 'Failed to save configuration');
    }
  };

  const handleClearRuntimeConfig = () => {
    clearRuntimeConfig();
    toast.success('Grok configuration cleared');
    setShowRuntimeConfig(false);
    setRuntimeEndpoint('');
    setRuntimeApiKey('');
    setEndpointError('');
  };

  const handleShowRuntimeConfig = () => {
    const config = loadRuntimeConfig();
    if (config) {
      setRuntimeEndpoint(config.endpoint);
      setRuntimeApiKey(config.apiKey);
    }
    setEndpointError('');
    setShowRuntimeConfig(true);
  };

  const handleFixLegacyEndpoint = () => {
    const config = loadRuntimeConfig();
    if (config) {
      setRuntimeEndpoint(CANONICAL_GROK_ENDPOINT);
      setRuntimeApiKey(config.apiKey);
    } else {
      setRuntimeEndpoint(CANONICAL_GROK_ENDPOINT);
      setRuntimeApiKey('');
    }
    setEndpointError('');
    setShowRuntimeConfig(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold tracking-tight">
          Create Your Video
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Describe your vision and we'll generate clips to create your video
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Grok AI Configuration
          </CardTitle>
          <CardDescription>
            Configure your Grok AI settings to generate videos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {legacyEndpoint && legacyMessage && (
            <Alert className="border-amber-500/50 bg-amber-500/5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">
                Endpoint Update Required
              </AlertTitle>
              <AlertDescription className="text-amber-900 dark:text-amber-100 text-sm space-y-3">
                <p>{legacyMessage}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFixLegacyEndpoint}
                  className="mt-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Update to {CANONICAL_GROK_ENDPOINT}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!isGrokConfigured && !legacyEndpoint && (
            <Alert className="border-amber-500/50 bg-amber-500/5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <AlertDescription className="text-amber-900 dark:text-amber-100 text-sm space-y-3">
                <p>
                  Grok AI must be configured to generate videos. You can either:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Configure runtime settings below (recommended for quick setup)</li>
                  <li>Set <code className="text-xs bg-amber-900/10 px-1 py-0.5 rounded">VITE_GROK_API_ENDPOINT</code> and <code className="text-xs bg-amber-900/10 px-1 py-0.5 rounded">VITE_GROK_API_KEY</code> environment variables</li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShowRuntimeConfig}
                  className="mt-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Grok Settings
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isGrokConfigured && !showRuntimeConfig && !legacyEndpoint && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-green-500/5 border-green-500/50">
              <div className="flex items-center gap-2 text-sm text-green-900 dark:text-green-100">
                <Check className="w-4 h-4" />
                <span>Grok AI is configured and ready</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShowRuntimeConfig}
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          )}

          {showRuntimeConfig && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Runtime Grok Configuration
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowRuntimeConfig(false);
                    setEndpointError('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="grok-endpoint">Grok API Endpoint</Label>
                  <Input
                    id="grok-endpoint"
                    type="text"
                    placeholder={CANONICAL_GROK_ENDPOINT}
                    value={runtimeEndpoint}
                    onChange={(e) => handleEndpointChange(e.target.value)}
                    className={endpointError ? 'border-destructive' : ''}
                  />
                  {endpointError && (
                    <p className="text-xs text-destructive flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{endpointError}</span>
                    </p>
                  )}
                  {!endpointError && runtimeEndpoint && !isEndpointFormatValid(runtimeEndpoint) && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Endpoint must start with http:// or https:// (e.g., {CANONICAL_GROK_ENDPOINT})</span>
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grok-api-key">Grok API Key</Label>
                  <Input
                    id="grok-api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={runtimeApiKey}
                    onChange={(e) => setRuntimeApiKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveRuntimeConfig}
                  disabled={!runtimeEndpoint.trim() || !runtimeApiKey.trim()}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
                {isGrokConfigured && (
                  <Button 
                    variant="outline"
                    onClick={handleClearRuntimeConfig}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Configuration is stored locally in your browser and will persist across sessions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Video Prompt
          </CardTitle>
          <CardDescription>
            Describe the video you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="A serene sunset over the ocean with waves gently crashing on the shore..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="min-h-32 resize-none"
          />
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            Video Settings
          </CardTitle>
          <CardDescription>
            Configure your video structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="clip-count" className="text-base">Number of Clips</Label>
              <span className="text-sm font-medium text-muted-foreground">
                {clipCount} {clipCount === 1 ? 'clip' : 'clips'}
              </span>
            </div>
            <Slider
              id="clip-count"
              min={1}
              max={5}
              step={1}
              value={[clipCount]}
              onValueChange={([value]) => onClipCountChange(value)}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="clip-duration" className="text-base">Duration per Clip</Label>
              <span className="text-sm font-medium text-muted-foreground">
                {perClipDuration}s
              </span>
            </div>
            <Slider
              id="clip-duration"
              min={5}
              max={120}
              step={5}
              value={[perClipDuration]}
              onValueChange={([value]) => onPerClipDurationChange(value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {clipCount === 1 
                ? 'Single clips can be up to 2 minutes (120 seconds)'
                : 'Each clip can be 5-120 seconds'
              }
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Duration</span>
              </div>
              <Badge variant={withinTolerance ? 'outline' : 'destructive'}>
                {totalDuration}s
              </Badge>
            </div>
            {validationMessage && (
              <p className={`text-xs ${withinTolerance ? 'text-muted-foreground' : 'text-destructive'}`}>
                {validationMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ReferenceImageUpload
        images={referenceImages}
        onImagesChange={onReferenceImagesChange}
      />
    </div>
  );
}
