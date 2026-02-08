import { useState } from 'react';
import AppShell from './components/AppShell';
import PromptComposer from './components/PromptComposer';
import ClipSegmentsList from './components/ClipSegmentsList';
import ComposedVideoPreview from './components/ComposedVideoPreview';
import MobileStepper from './components/MobileStepper';
import BottomActionBar from './components/BottomActionBar';
import { useVideoSession } from './hooks/useVideoSession';
import { isWithinTolerance } from './lib/duration';
import type { ReferenceImageFile } from './lib/referenceImages';
import { useVideoProvider } from './hooks/useVideoProvider';
import { Toaster } from '@/components/ui/sonner';
import type { ClipData } from './providers/videoProvider';

type Step = 'prompt' | 'clips' | 'compose' | 'download';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('prompt');
  const [prompt, setPrompt] = useState('');
  const [clipCount, setClipCount] = useState(3);
  const [perClipDuration, setPerClipDuration] = useState(20);
  const [referenceImages, setReferenceImages] = useState<ReferenceImageFile[]>([]);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [composedVideoUrl, setComposedVideoUrl] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const { provider, setProvider, isGrokConfigured, explicitDemoOptIn } = useVideoProvider();

  const {
    sessionId,
    segments,
    isGenerating,
    startGeneration,
    retrySegment,
    reset
  } = useVideoSession();

  const handleStartGeneration = async () => {
    setCurrentStep('clips');
    setClips([]);
    setComposedVideoUrl(null);
    
    // Extract File objects from ReferenceImageFile
    const imageFiles = referenceImages.map(img => img.file);
    const generatedClips = await startGeneration(prompt, clipCount, perClipDuration, imageFiles);
    
    if (generatedClips) {
      setClips(generatedClips);
      // Move to compose step when all clips are ready
      setCurrentStep('compose');
      setIsComposing(true);
    }
  };

  const handleRetry = async (segmentIndex: number) => {
    const retriedClip = await retrySegment(segmentIndex);
    if (retriedClip) {
      setClips(prev => {
        const updated = [...prev];
        updated[segmentIndex] = retriedClip;
        return updated;
      });
    }
  };

  const handleStartOver = () => {
    reset();
    setCurrentStep('prompt');
    setPrompt('');
    setReferenceImages([]);
    setClips([]);
    setComposedVideoUrl(null);
    setIsComposing(false);
  };

  const handleComposed = (url: string) => {
    setComposedVideoUrl(url);
    setIsComposing(false);
    setCurrentStep('download');
  };

  const canProceed = () => {
    if (currentStep === 'prompt') {
      const totalDuration = clipCount * perClipDuration;
      return prompt.trim().length > 0 && isWithinTolerance(totalDuration, clipCount);
    }
    return false;
  };

  const allSegmentsComplete = segments.every(s => s.status.__kind__ === 'completed');
  const hasFailedSegments = segments.some(s => s.status.__kind__ === 'failed');

  // Determine action button based on current step
  const getActionButton = () => {
    if (currentStep === 'prompt') {
      return {
        label: 'Generate Video',
        onClick: handleStartGeneration,
        disabled: !canProceed(),
        loading: false,
        variant: 'default' as const
      };
    }
    
    if (currentStep === 'clips' && allSegmentsComplete && !hasFailedSegments) {
      return {
        label: 'Continue to Preview',
        onClick: () => {
          setCurrentStep('compose');
          setIsComposing(true);
        },
        disabled: false,
        loading: false,
        variant: 'default' as const
      };
    }
    
    if (currentStep === 'download') {
      return {
        label: 'Start Over',
        onClick: handleStartOver,
        disabled: false,
        loading: false,
        variant: 'outline' as const
      };
    }
    
    return null;
  };

  return (
    <AppShell>
      <div className="min-h-screen flex flex-col pb-24">
        <div className="flex-1 container max-w-4xl mx-auto px-4 py-8">
          <MobileStepper currentStep={currentStep} />

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
              onRetry={handleRetry}
            />
          )}

          {(currentStep === 'compose' || currentStep === 'download') && (
            <ComposedVideoPreview
              clips={clips}
              composedVideoUrl={composedVideoUrl}
              onComposed={handleComposed}
              isComposing={isComposing}
            />
          )}
        </div>

        <BottomActionBar action={getActionButton()} />
      </div>
      <Toaster />
    </AppShell>
  );
}

export default App;
