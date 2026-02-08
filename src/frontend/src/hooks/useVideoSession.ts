import { useState, useCallback, useRef } from 'react';
import { useActor } from './useActor';
import { generateClip, type ClipData } from '../providers/videoProvider';
import type { PublicSegment } from '../backend';
import type { ReferenceImageFile } from '../lib/referenceImages';
import { getGrokConfig } from '../providers/grokProvider';
import { getCurrentProvider } from '../providers/videoProvider';

export interface VideoSessionState {
  sessionId: bigint | null;
  segments: PublicSegment[];
  clips: ClipData[];
  isGenerating: boolean;
  error: string | null;
  generationError: string | null; // Run-level error before segments exist
  referenceImages: ReferenceImageFile[];
}

export function useVideoSession() {
  const { actor } = useActor();
  const [state, setState] = useState<VideoSessionState>({
    sessionId: null,
    segments: [],
    clips: [],
    isGenerating: false,
    error: null,
    generationError: null,
    referenceImages: []
  });
  
  // Track which segments are currently being generated to prevent duplicate requests
  const generatingSegments = useRef<Set<number>>(new Set());

  const setReferenceImages = useCallback((images: ReferenceImageFile[]) => {
    setState(prev => ({ ...prev, referenceImages: images }));
  }, []);

  const startGeneration = useCallback(async (
    prompt: string,
    clipCount: number,
    perClipDuration: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { 
        success: false, 
        error: 'Backend connection not available. Please refresh the page and try again.' 
      };
    }

    // Preflight check: validate provider configuration
    const currentProvider = getCurrentProvider();
    if (currentProvider === 'grok') {
      const grokConfig = getGrokConfig();
      if (!grokConfig) {
        return {
          success: false,
          error: 'Grok AI is not configured. Please configure Grok settings (runtime configuration or environment variables) in the Provider section above before generating videos.'
        };
      }
    }

    try {
      // Clear any previous generation error
      setState(prev => ({ 
        ...prev, 
        error: null, 
        generationError: null,
        isGenerating: true 
      }));

      // Derive segment prompts
      const segmentPrompts = Array(clipCount).fill(prompt);
      
      // Create session
      const sessionId = await actor.createSession(
        prompt,
        segmentPrompts,
        BigInt(perClipDuration)
      );

      // Fetch initial session state
      const session = await actor.getSession(sessionId);
      
      setState(prev => ({
        ...prev,
        sessionId,
        segments: session.segments,
        clips: new Array(session.segments.length).fill(null),
        isGenerating: true,
        error: null,
        generationError: null
      }));

      // Start generating clips
      generateClips(sessionId, session.segments);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to start video generation. Please try again.';
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        generationError: state.referenceImages.length > 0
          ? `${errorMessage} (Note: This request included ${state.referenceImages.length} reference image${state.referenceImages.length > 1 ? 's' : ''})`
          : errorMessage
      }));
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, [actor, state.referenceImages.length]);

  const generateClips = useCallback(async (
    sessionId: bigint,
    segments: PublicSegment[]
  ) => {
    if (!actor) return;

    const referenceImageFiles = state.referenceImages.map(img => img.file);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Skip if already generating or completed
      if (generatingSegments.current.has(i)) continue;
      if (segment.status.__kind__ === 'completed') continue;
      if (segment.status.__kind__ === 'generating') continue;

      generatingSegments.current.add(i);

      try {
        // Update status to generating
        await actor.updateSegmentStatus(
          sessionId,
          BigInt(i),
          { __kind__: 'generating', generating: null }
        );

        // Fetch updated session
        const session = await actor.getSession(sessionId);
        setState(prev => ({
          ...prev,
          segments: session.segments
        }));

        // Generate video clip
        const clipData = await generateClip(
          segment.prompt,
          Number(session.perClipDuration),
          i,
          referenceImageFiles.length > 0 ? referenceImageFiles : undefined
        );

        // Update status to completed
        await actor.updateSegmentStatus(
          sessionId,
          BigInt(i),
          { __kind__: 'completed', completed: null }
        );

        // Fetch updated session and update clips immediately
        const updatedSession = await actor.getSession(sessionId);
        setState(prev => {
          const newClips = [...prev.clips];
          newClips[i] = clipData;
          return {
            ...prev,
            segments: updatedSession.segments,
            clips: newClips
          };
        });

      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Generation failed';
        
        // Update status to failed
        await actor.updateSegmentStatus(
          sessionId,
          BigInt(i),
          { __kind__: 'failed', failed: errorMessage }
        );

        // Fetch updated session
        const session = await actor.getSession(sessionId);
        setState(prev => ({
          ...prev,
          segments: session.segments
        }));
      } finally {
        generatingSegments.current.delete(i);
      }
    }

    // Check if all segments are done
    setState(prev => {
      const allDone = prev.segments.every(
        s => s.status.__kind__ === 'completed' || s.status.__kind__ === 'failed'
      );
      return {
        ...prev,
        isGenerating: !allDone
      };
    });
  }, [actor, state.referenceImages]);

  const retrySegment = useCallback(async (index: number) => {
    if (!actor || !state.sessionId) return;

    const segment = state.segments[index];
    if (!segment) return;

    // Prevent duplicate retry requests
    if (generatingSegments.current.has(index)) return;

    generatingSegments.current.add(index);

    try {
      // Update status to generating
      await actor.updateSegmentStatus(
        state.sessionId,
        BigInt(index),
        { __kind__: 'generating', generating: null }
      );

      // Fetch updated session
      const session = await actor.getSession(state.sessionId);
      setState(prev => ({
        ...prev,
        segments: session.segments,
        isGenerating: true
      }));

      const referenceImageFiles = state.referenceImages.map(img => img.file);

      // Generate video clip
      const clipData = await generateClip(
        segment.prompt,
        Number(session.perClipDuration),
        index,
        referenceImageFiles.length > 0 ? referenceImageFiles : undefined
      );

      // Update status to completed
      await actor.updateSegmentStatus(
        state.sessionId,
        BigInt(index),
        { __kind__: 'completed', completed: null }
      );

      // Fetch updated session and update clips immediately
      const updatedSession = await actor.getSession(state.sessionId);
      setState(prev => {
        const newClips = [...prev.clips];
        newClips[index] = clipData;
        return {
          ...prev,
          segments: updatedSession.segments,
          clips: newClips
        };
      });

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Retry failed';
      
      // Update status to failed
      await actor.updateSegmentStatus(
        state.sessionId,
        BigInt(index),
        { __kind__: 'failed', failed: errorMessage }
      );

      // Fetch updated session
      const session = await actor.getSession(state.sessionId);
      setState(prev => ({
        ...prev,
        segments: session.segments
      }));
    } finally {
      generatingSegments.current.delete(index);
      
      // Check if all segments are done
      setState(prev => {
        const allDone = prev.segments.every(
          s => s.status.__kind__ === 'completed' || s.status.__kind__ === 'failed'
        );
        return {
          ...prev,
          isGenerating: !allDone
        };
      });
    }
  }, [actor, state.sessionId, state.segments, state.referenceImages]);

  const reset = useCallback(() => {
    generatingSegments.current.clear();
    setState({
      sessionId: null,
      segments: [],
      clips: [],
      isGenerating: false,
      error: null,
      generationError: null,
      referenceImages: []
    });
  }, []);

  return {
    ...state,
    startGeneration,
    retrySegment,
    reset,
    setReferenceImages
  };
}
