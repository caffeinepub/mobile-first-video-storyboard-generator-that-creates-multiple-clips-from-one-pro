import { useState, useCallback } from 'react';
import { useActor } from './useActor';
import type { PublicSegment, VideoSessionId } from '../backend';
import { deriveSegments, generateClip, type ClipData } from '../providers/videoProvider';
import { toast } from 'sonner';

export function useVideoSession() {
  const { actor } = useActor();
  const [sessionId, setSessionId] = useState<VideoSessionId | null>(null);
  const [segments, setSegments] = useState<PublicSegment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRunImages, setCurrentRunImages] = useState<File[]>([]);

  const startGeneration = useCallback(
    async (
      prompt: string,
      clipCount: number,
      perClipDuration: number,
      referenceImages?: File[]
    ): Promise<ClipData[] | null> => {
      if (!actor) {
        toast.error('Backend not ready');
        return null;
      }

      setIsGenerating(true);
      
      // Store reference images for this run
      const runImages = referenceImages || [];
      setCurrentRunImages(runImages);

      try {
        // Derive segment prompts with reference images
        const segmentPrompts = await deriveSegments(prompt, clipCount, runImages);
        
        // Create session in backend
        const newSessionId = await actor.createSession(
          prompt,
          segmentPrompts,
          BigInt(perClipDuration)
        );
        setSessionId(newSessionId);

        // Initialize segments with queued status
        const initialSegments: PublicSegment[] = segmentPrompts.map(p => ({
          prompt: p,
          status: { __kind__: 'queued' as const, queued: null }
        }));
        setSegments(initialSegments);

        // Generate all clips with reference images
        const clips: ClipData[] = [];
        for (let i = 0; i < segmentPrompts.length; i++) {
          try {
            // Update status to generating
            setSegments(prev => {
              const updated = [...prev];
              updated[i] = { ...updated[i], status: { __kind__: 'generating', generating: null } };
              return updated;
            });

            // Generate clip with reference images
            const clip = await generateClip(segmentPrompts[i], perClipDuration, i, runImages);
            clips.push(clip);

            // Update status to completed
            setSegments(prev => {
              const updated = [...prev];
              updated[i] = { ...updated[i], status: { __kind__: 'completed', completed: null } };
              return updated;
            });

            // Update backend
            await actor.updateSegmentStatus(
              newSessionId,
              BigInt(i),
              { __kind__: 'completed', completed: null }
            );
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Generation failed';
            
            // Update status to failed
            setSegments(prev => {
              const updated = [...prev];
              updated[i] = { ...updated[i], status: { __kind__: 'failed', failed: errorMessage } };
              return updated;
            });

            // Update backend
            await actor.updateSegmentStatus(
              newSessionId,
              BigInt(i),
              { __kind__: 'failed', failed: errorMessage }
            );
          }
        }

        return clips;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start generation';
        toast.error(message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [actor]
  );

  const retrySegment = useCallback(
    async (index: number): Promise<ClipData | null> => {
      if (!actor || !sessionId || !segments[index]) {
        return null;
      }

      try {
        // Update status to generating
        setSegments(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: { __kind__: 'generating', generating: null } };
          return updated;
        });

        // Get duration from session
        const session = await actor.getSession(sessionId);
        const duration = Number(session.perClipDuration);

        // Generate clip with the same reference images from the current run
        const clip = await generateClip(segments[index].prompt, duration, index, currentRunImages);

        // Update status to completed
        setSegments(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: { __kind__: 'completed', completed: null } };
          return updated;
        });

        // Update backend
        await actor.updateSegmentStatus(
          sessionId,
          BigInt(index),
          { __kind__: 'completed', completed: null }
        );

        toast.success(`Clip ${index + 1} regenerated successfully`);
        return clip;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Retry failed';
        
        // Update status to failed
        setSegments(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: { __kind__: 'failed', failed: errorMessage } };
          return updated;
        });

        // Update backend
        await actor.updateSegmentStatus(
          sessionId,
          BigInt(index),
          { __kind__: 'failed', failed: errorMessage }
        );

        toast.error(errorMessage);
        return null;
      }
    },
    [actor, sessionId, segments, currentRunImages]
  );

  const reset = useCallback(() => {
    setSessionId(null);
    setSegments([]);
    setIsGenerating(false);
    setCurrentRunImages([]);
  }, []);

  return {
    sessionId,
    segments,
    isGenerating,
    startGeneration,
    retrySegment,
    reset
  };
}
