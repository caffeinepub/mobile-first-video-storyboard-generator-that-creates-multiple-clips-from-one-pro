import { useState, useCallback } from 'react';
import { useActor } from './useActor';
import { deriveSegments, generateClip, isGrokConfigured } from '../providers/videoProvider';
import type { PublicSegment } from '../backend';
import type { ClipData } from '../providers/videoProvider';
import type { ReferenceImageFile } from '../lib/referenceImages';

export function useVideoSession() {
  const { actor } = useActor();
  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const [segments, setSegments] = useState<PublicSegment[]>([]);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImageFile[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const startGeneration = useCallback(async (
    prompt: string,
    clipCount: number,
    perClipDuration: number
  ) => {
    if (!actor) {
      setGenerationError('Backend connection not available');
      return;
    }

    // Always require Grok configuration
    if (!isGrokConfigured()) {
      setGenerationError(
        'Grok AI must be configured to generate videos. Please configure Grok via runtime settings or set VITE_GROK_API_ENDPOINT and VITE_GROK_API_KEY environment variables.'
      );
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Derive segments from prompt
      const segmentPrompts = await deriveSegments(
        prompt, 
        clipCount,
        referenceImages.map(img => img.file)
      );

      // Create session in backend
      const newSessionId = await actor.createSession(
        prompt,
        segmentPrompts,
        BigInt(perClipDuration)
      );
      setSessionId(newSessionId);

      // Initialize segments
      const initialSegments: PublicSegment[] = segmentPrompts.map(p => ({
        prompt: p,
        status: { __kind__: 'queued' as const, queued: null }
      }));
      setSegments(initialSegments);
      setClips([]);

      // Generate clips incrementally
      for (let i = 0; i < segmentPrompts.length; i++) {
        try {
          // Update status to generating
          await actor.updateSegmentStatus(
            newSessionId,
            BigInt(i),
            { __kind__: 'generating', generating: null }
          );
          setSegments(prev => prev.map((seg, idx) =>
            idx === i ? { ...seg, status: { __kind__: 'generating' as const, generating: null } } : seg
          ));

          // Generate clip
          const clip = await generateClip(
            segmentPrompts[i],
            perClipDuration,
            i,
            referenceImages.map(img => img.file)
          );

          // Update status to completed
          await actor.updateSegmentStatus(
            newSessionId,
            BigInt(i),
            { __kind__: 'completed', completed: null }
          );
          setSegments(prev => prev.map((seg, idx) =>
            idx === i ? { ...seg, status: { __kind__: 'completed' as const, completed: null } } : seg
          ));
          setClips(prev => [...prev, clip]);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate clip';
          
          // Update status to failed
          await actor.updateSegmentStatus(
            newSessionId,
            BigInt(i),
            { __kind__: 'failed', failed: errorMessage }
          );
          setSegments(prev => prev.map((seg, idx) =>
            idx === i ? { ...seg, status: { __kind__: 'failed' as const, failed: errorMessage } } : seg
          ));
          setClips(prev => [...prev, {
            url: '',
            duration: perClipDuration,
            prompt: segmentPrompts[i]
          }]);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start generation';
      
      // Include reference image context in error message if applicable
      const hasReferenceImages = referenceImages.length > 0;
      const contextualError = hasReferenceImages
        ? `${errorMessage}. Note: ${referenceImages.length} reference ${referenceImages.length === 1 ? 'image was' : 'images were'} provided.`
        : errorMessage;
      
      setGenerationError(contextualError);
    } finally {
      setIsGenerating(false);
    }
  }, [actor, referenceImages]);

  const retrySegment = useCallback(async (index: number) => {
    if (!actor || !sessionId) return;

    const segment = segments[index];
    if (!segment) return;

    try {
      // Update status to generating
      await actor.updateSegmentStatus(
        sessionId,
        BigInt(index),
        { __kind__: 'generating', generating: null }
      );
      setSegments(prev => prev.map((seg, idx) =>
        idx === index ? { ...seg, status: { __kind__: 'generating' as const, generating: null } } : seg
      ));

      // Get duration from first clip or default
      const duration = clips[0]?.duration || 10;

      // Generate clip
      const clip = await generateClip(
        segment.prompt,
        duration,
        index,
        referenceImages.map(img => img.file)
      );

      // Update status to completed
      await actor.updateSegmentStatus(
        sessionId,
        BigInt(index),
        { __kind__: 'completed', completed: null }
      );
      setSegments(prev => prev.map((seg, idx) =>
        idx === index ? { ...seg, status: { __kind__: 'completed' as const, completed: null } } : seg
      ));
      setClips(prev => prev.map((c, idx) => idx === index ? clip : c));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate clip';
      
      // Update status to failed
      await actor.updateSegmentStatus(
        sessionId,
        BigInt(index),
        { __kind__: 'failed', failed: errorMessage }
      );
      setSegments(prev => prev.map((seg, idx) =>
        idx === index ? { ...seg, status: { __kind__: 'failed' as const, failed: errorMessage } } : seg
      ));
    }
  }, [actor, sessionId, segments, clips, referenceImages]);

  const reset = useCallback(() => {
    setSessionId(null);
    setSegments([]);
    setClips([]);
    setIsGenerating(false);
    setReferenceImages([]);
    setGenerationError(null);
  }, []);

  return {
    sessionId,
    segments,
    clips,
    isGenerating,
    startGeneration,
    retrySegment,
    reset,
    referenceImages,
    setReferenceImages,
    generationError
  };
}
