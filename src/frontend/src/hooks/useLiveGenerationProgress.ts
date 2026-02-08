import { useState, useEffect } from 'react';
import type { PublicSegment } from '../backend';

interface LiveProgressResult {
  progress: number;
  label: string;
}

/**
 * Hook that provides live progress updates during clip generation
 * Updates at least once per second while any segment is generating
 */
export function useLiveGenerationProgress(segments: PublicSegment[]): LiveProgressResult {
  const [tick, setTick] = useState(0);

  // Count segments by status
  const completedCount = segments.filter(s => s.status.__kind__ === 'completed').length;
  const failedCount = segments.filter(s => s.status.__kind__ === 'failed').length;
  const generatingIndex = segments.findIndex(s => s.status.__kind__ === 'generating');
  const isGenerating = generatingIndex !== -1;

  // Set up ticker while generating
  useEffect(() => {
    if (!isGenerating) {
      setTick(0);
      return;
    }

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Calculate progress
  let progress = 0;
  let label = '';

  if (segments.length === 0) {
    progress = 0;
    label = 'Preparing...';
  } else if (completedCount === segments.length) {
    // All completed
    progress = 100;
    label = `All ${segments.length} ${segments.length === 1 ? 'clip' : 'clips'} completed`;
  } else if (completedCount + failedCount === segments.length) {
    // All done (some failed)
    progress = 100;
    label = `${completedCount} of ${segments.length} ${segments.length === 1 ? 'clip' : 'clips'} completed`;
  } else if (isGenerating) {
    // Currently generating
    const currentClipNumber = generatingIndex + 1;
    
    // Base progress from completed clips
    const baseProgress = (completedCount / segments.length) * 100;
    
    // Add simulated progress for current clip (0-90% of one clip's worth)
    // Use tick to create smooth animation, capped at 90% to avoid appearing complete
    const tickProgress = Math.min((tick * 2) % 90, 90); // 2% per second, max 90%
    const currentClipProgress = (tickProgress / 100) * (100 / segments.length);
    
    progress = Math.min(baseProgress + currentClipProgress, 99); // Never reach 100 until actually complete
    label = `Generating clip ${currentClipNumber} of ${segments.length}...`;
  } else {
    // Queued
    progress = (completedCount / segments.length) * 100;
    label = `${completedCount} of ${segments.length} ${segments.length === 1 ? 'clip' : 'clips'} completed`;
  }

  return { progress, label };
}
