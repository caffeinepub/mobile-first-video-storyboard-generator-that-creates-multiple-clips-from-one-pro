import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateTotalDuration, isWithinTolerance, getValidationMessage } from '../lib/duration';
import { Sparkles, Clock, Film, AlertCircle, Zap, Settings, Check, X } from 'lucide-react';
import ReferenceImageUpload from './ReferenceImageUpload';
import type { ReferenceImageFile } from '../lib/referenceImages';
import type { VideoProvider } from '../providers/videoProvider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { saveRuntimeConfig, clearRuntimeConfig, loadRuntimeConfig } from '../lib/grokRuntimeConfig';
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
  provider: VideoProvider;
  onProviderChange: (provider: VideoProvider) => void;
  isGrokConfigured: boolean;
  explicitDemoOptIn?: boolean;
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
  provider,
  onProviderChange,
  isGrokConfigured,
  explicitDemoOptIn = false
}: PromptComposerProps) {
  const totalDuration = calculateTotalDuration(clipCount, perClipDuration);
  const withinTolerance = isWithinTolerance(totalDuration, clipCount);
  const validationMessage = getValidationMessage(totalDuration, clipCount);

  const [showRuntimeConfig, setShowRuntimeConfig] = useState(false);
  const [runtimeEndpoint, setRuntimeEndpoint] = useState('');
  const [runtimeApiKey, setRuntimeApiKey] = useState('');

  const handleSaveRuntimeConfig = () => {
    if (!runtimeEndpoint.trim() || !runtimeApiKey.trim()) {
      toast.error('Both endpoint and API key are required');
      return;
    }

    try {
      saveRuntimeConfig(runtimeEndpoint, runtimeApiKey);
      toast.success('Grok AI is now active and ready to use');
      setShowRuntimeConfig(false);
      setRuntimeEndpoint('');
      setRuntimeApiKey('');
      // Provider will auto-switch to Grok via the config change subscription
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const handleClearRuntimeConfig = () => {
    clearRuntimeConfig();
    toast.success('Grok configuration cleared');
    setShowRuntimeConfig(false);
    setRuntimeEndpoint('');
    setRuntimeApiKey('');
  };

  const handleShowRuntimeConfig = () => {
    const config = loadRuntimeConfig();
    if (config) {
      setRuntimeEndpoint(config.endpoint);
      setRuntimeApiKey(config.apiKey);
    }
    setShowRuntimeConfig(true);
  };

  const handleSwitchToGrok = () => {
    if (isGrokConfigured) {
      onProviderChange('grok');
      toast.success('Switched to Grok AI');
    }
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
            <Zap className="w-5 h-5 text-primary" />
            Provider
          </CardTitle>
          <CardDescription>
            Choose how your video clips will be generated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={provider} onValueChange={(value) => onProviderChange(value as VideoProvider)}>
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="grok" id="provider-grok" disabled={!isGrokConfigured} />
              <Label 
                htmlFor="provider-grok" 
                className={`flex-1 cursor-pointer ${!isGrokConfigured ? 'opacity-50' : ''}`}
              >
                <div className="font-medium">Grok AI</div>
                <div className="text-sm text-muted-foreground">
                  AI-powered video generation
                </div>
              </Label>
              {provider === 'grok' && (
                <Badge variant="default">Active</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="demo" id="provider-demo" />
              <Label htmlFor="provider-demo" className="flex-1 cursor-pointer">
                <div className="font-medium">Demo Mode</div>
                <div className="text-sm text-muted-foreground">
                  Placeholder clips for testing
                </div>
              </Label>
              {provider === 'demo' && (
                <Badge variant="secondary">Active</Badge>
              )}
            </div>
          </RadioGroup>

          {!isGrokConfigured && (
            <Alert className="border-amber-500/50 bg-amber-500/5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <AlertDescription className="text-amber-900 dark:text-amber-100 text-sm space-y-3">
                <p>
                  Grok AI is not configured. To enable AI generation, you can either:
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

          {isGrokConfigured && !showRuntimeConfig && (
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
                  onClick={() => setShowRuntimeConfig(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="grok-endpoint">Grok API Endpoint</Label>
                  <Input
                    id="grok-endpoint"
                    type="url"
                    placeholder="https://api.example.com"
                    value={runtimeEndpoint}
                    onChange={(e) => setRuntimeEndpoint(e.target.value)}
                  />
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

          {provider === 'demo' && isGrokConfigured && explicitDemoOptIn && (
            <Alert className="border-blue-500/50 bg-blue-500/5">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <AlertDescription className="text-blue-900 dark:text-blue-100 text-sm">
                <div className="flex items-center justify-between">
                  <span>You're using Demo Mode by choice. Grok AI is available.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSwitchToGrok}
                  >
                    Switch to Grok
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Duration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{totalDuration}s</span>
                {withinTolerance ? (
                  <Badge variant="default" className="gap-1">
                    <Check className="w-3 h-3" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <X className="w-3 h-3" />
                    Invalid
                  </Badge>
                )}
              </div>
            </div>
            {!withinTolerance && validationMessage && (
              <p className="text-xs text-destructive mt-2">
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
