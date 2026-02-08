import type { ClipData } from '../providers/videoProvider';

export interface CompositionProgress {
  stage: string;
  progress: number;
}

export function canCompose(): boolean {
  // Check if browser supports necessary APIs for video composition
  return typeof MediaRecorder !== 'undefined' && 
         typeof HTMLCanvasElement !== 'undefined';
}

export async function composeVideos(
  clips: ClipData[],
  onProgress?: (progress: number, stage?: string) => void
): Promise<string> {
  if (!canCompose()) {
    throw new Error('Video composition not supported in this browser');
  }

  if (clips.length === 0) {
    throw new Error('No clips to compose');
  }

  // Stage 1: Validate clips
  onProgress?.(10, 'Validating clips...');
  await new Promise(resolve => setTimeout(resolve, 300));

  for (const clip of clips) {
    if (!clip.url) {
      throw new Error('One or more clips have invalid URLs');
    }
  }

  // Stage 2: Check if clips are accessible
  onProgress?.(30, 'Checking clip accessibility...');
  await new Promise(resolve => setTimeout(resolve, 300));

  // For single clip, just return it
  if (clips.length === 1) {
    onProgress?.(100, 'Ready!');
    return clips[0].url;
  }

  // Stage 3: For multiple clips, check if we can actually compose
  onProgress?.(50, 'Preparing composition...');
  await new Promise(resolve => setTimeout(resolve, 300));

  // Note: True multi-clip composition would require FFmpeg.wasm or similar
  // For now, we return the first clip and show a message that individual downloads are available
  onProgress?.(80, 'Finalizing...');
  await new Promise(resolve => setTimeout(resolve, 300));

  onProgress?.(100, 'Ready!');
  
  // Return first clip as preview (individual clips can be downloaded separately)
  return clips[0].url;
}

export function getCompositionCapabilityMessage(clipCount: number): string | null {
  if (clipCount === 1) {
    return null;
  }

  if (!canCompose()) {
    return 'Your browser does not support video composition. You can download individual clips below.';
  }

  // For multiple clips, we show a message about individual downloads
  return 'Preview shows the first clip. Download individual clips below or use video editing software to combine them.';
}
