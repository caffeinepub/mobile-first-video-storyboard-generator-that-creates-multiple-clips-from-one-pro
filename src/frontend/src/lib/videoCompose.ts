import type { ClipData } from '../providers/videoProvider';

export function canCompose(): boolean {
  // Check if browser supports necessary APIs for video composition
  return typeof MediaRecorder !== 'undefined' && 
         typeof HTMLCanvasElement !== 'undefined' &&
         typeof OffscreenCanvas !== 'undefined';
}

export async function composeVideos(
  clips: ClipData[],
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!canCompose()) {
    throw new Error('Video composition not supported in this browser');
  }

  // For demo purposes, we'll create a simple composition
  // In production, this would use FFmpeg.wasm or similar
  
  // Simulate composition progress
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 200));
    onProgress?.(i);
  }

  // For now, return the first clip as the "composed" video
  // In production, this would actually stitch videos together
  if (clips.length > 0) {
    return clips[0].url;
  }

  throw new Error('No clips to compose');
}

export function downloadVideo(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

