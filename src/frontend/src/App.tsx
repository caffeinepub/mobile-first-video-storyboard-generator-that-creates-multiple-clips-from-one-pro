import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/AppShell';
import PromptComposer from './components/PromptComposer';
import ClipSegmentsList from './components/ClipSegmentsList';
import ComposedVideoPreview from './components/ComposedVideoPreview';
import MobileStepper from './components/MobileStepper';
import BottomActionBar from './components/BottomActionBar';
import { useVideoSession } from './hooks/useVideoSession';
import { useVideoProvider } from './hooks/useVideoProvider';
import { isWithinTolerance, calculateTotalDuration } from './lib/duration';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const queryClient = new QueryClient();

type Step = 'prompt' | 'clips' | 'compose' | 'download';

function VideoApp() {
  const [currentStep, setCurrentStep] = useState<Step>('prompt');
  const [prompt, setPrompt] = useState('');
  const [clipCount, setClipCount] = useState(1);
  const [perClipDuration, setPerClipDuration] = useState(10);
  const [composedVideoUrl, setComposedVideoUrl] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const { 
    provider, 
    setProvider, 
    isGrokConfigured,
    explicitDemoOptIn 
  } = useVideoProvider();

  const {
    segments,
    clips,
    isGenerating,
    startGeneration,
    retrySegment,
    reset,
    referenceImages,
    setReferenceImages,
    generationError
  } = useVideoSession();

  const totalDuration = calculateTotalDuration(clipCount, perClipDuration);
  const withinTolerance = isWithinTolerance(totalDuration, clipCount);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a video prompt');
      return;
    }

    if (!withinTolerance) {
      toast.error('Please adjust your video settings to meet duration requirements');
      return;
    }

    const result = await startGeneration(prompt, clipCount, perClipDuration);
    
    if (result.success) {
      setCurrentStep('clips');
    } else {
      // Stay on prompt step and show error
      toast.error(result.error || 'Failed to start generation');
    }
  };

  const handleContinueToCompose = () => {
    const successfulClips = clips.filter(clip => clip !== null);
    
    if (successfulClips.length === 0) {
      toast.error('No clips completed successfully. Please retry failed clips or start over.');
      return;
    }

    setIsComposing(true);
    setCurrentStep('compose');
  };

  const handleStartOver = () => {
    reset();
    setPrompt('');
    setClipCount(1);
    setPerClipDuration(10);
    setComposedVideoUrl(null);
    setIsComposing(false);
    setCurrentStep('prompt');
  };

  const handleBackToPrompt = () => {
    reset();
    setCurrentStep('prompt');
  };

  const handleComposed = (url: string) => {
    setComposedVideoUrl(url);
    setIsComposing(false);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'prompt':
        return prompt.trim().length > 0 && withinTolerance;
      case 'clips': {
        const allDone = segments.every(
          s => s.status.__kind__ === 'completed' || s.status.__kind__ === 'failed'
        );
        const hasSuccess = clips.some(clip => clip !== null);
        return allDone && hasSuccess;
      }
      case 'compose':
        return true;
      default:
        return false;
    }
  };

  const getActionLabel = (): string => {
    switch (currentStep) {
      case 'prompt':
        return 'Generate Video';
      case 'clips':
        return 'Continue to Compose';
      case 'compose':
        return 'View Download';
      default:
        return 'Next';
    }
  };

  const handleAction = () => {
    switch (currentStep) {
      case 'prompt':
        handleGenerate();
        break;
      case 'clips':
        handleContinueToCompose();
        break;
      case 'compose':
        setCurrentStep('download');
        break;
    }
  };

  const getActionButton = () => {
    if (currentStep === 'download') {
      return null;
    }

    return {
      label: getActionLabel(),
      onClick: handleAction,
      disabled: !canProceed() || isGenerating,
      loading: isGenerating && currentStep === 'prompt'
    };
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
        <MobileStepper currentStep={currentStep} />

        <div className="mt-8">
          {currentStep === 'prompt' && (
            <PromptComposer
              prompt={prompt}
              onPromptChange={setPrompt}
              clipCount={clipCount}
              onClipCountChange={setClipCount}
              perClipDuration={perClipDuration}
              onPerClipDurationChange={setPerClipDuration}
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
              provider={provider}
              onProviderChange={setProvider}
              isGrokConfigured={isGrokConfigured}
              explicitDemoOptIn={explicitDemoOptIn}
            />
          )}

          {currentStep === 'clips' && (
            <ClipSegmentsList
              segments={segments}
              clips={clips}
              onRetry={retrySegment}
              generationError={generationError}
              onBackToPrompt={handleBackToPrompt}
            />
          )}

          {(currentStep === 'compose' || currentStep === 'download') && (
            <ComposedVideoPreview
              clips={clips.filter(clip => clip !== null)}
              composedVideoUrl={composedVideoUrl}
              onComposed={handleComposed}
              isComposing={isComposing}
            />
          )}
        </div>
      </div>

      <BottomActionBar action={getActionButton()} />
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VideoApp />
      <Toaster />
    </QueryClientProvider>
  );
}
