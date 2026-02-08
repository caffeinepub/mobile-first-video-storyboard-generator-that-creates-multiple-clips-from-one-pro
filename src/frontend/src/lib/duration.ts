const MIN_DURATION = 55;
const MAX_DURATION = 65;
const MAX_SINGLE_CLIP_DURATION = 120;

export function calculateTotalDuration(clipCount: number, perClipDuration: number): number {
  return clipCount * perClipDuration;
}

export function isWithinTolerance(totalDuration: number, clipCount: number = 1): boolean {
  // For single clip, allow up to 120 seconds
  if (clipCount === 1) {
    return totalDuration > 0 && totalDuration <= MAX_SINGLE_CLIP_DURATION;
  }
  
  // For multiple clips, use the 55-65 second tolerance
  return totalDuration >= MIN_DURATION && totalDuration <= MAX_DURATION;
}

export function getValidationMessage(totalDuration: number, clipCount: number): string | null {
  if (clipCount === 1) {
    if (totalDuration <= 0) {
      return 'Duration must be greater than 0 seconds';
    }
    if (totalDuration > MAX_SINGLE_CLIP_DURATION) {
      return `Single clip duration cannot exceed ${MAX_SINGLE_CLIP_DURATION} seconds`;
    }
    return null;
  }
  
  // Multiple clips
  if (totalDuration < MIN_DURATION) {
    return `Total duration must be at least ${MIN_DURATION} seconds for multiple clips`;
  }
  if (totalDuration > MAX_DURATION) {
    return `Total duration cannot exceed ${MAX_DURATION} seconds for multiple clips`;
  }
  return null;
}

export function suggestClipCount(targetDuration: number, perClipDuration: number): number {
  return Math.round(targetDuration / perClipDuration);
}

export function suggestPerClipDuration(targetDuration: number, clipCount: number): number {
  return Math.round(targetDuration / clipCount);
}

export function autoSplit(totalDuration: number, clipCount: number): number[] {
  const baseClipDuration = Math.floor(totalDuration / clipCount);
  const remainder = totalDuration % clipCount;
  
  const durations = Array(clipCount).fill(baseClipDuration);
  
  // Distribute remainder across first clips
  for (let i = 0; i < remainder; i++) {
    durations[i]++;
  }
  
  return durations;
}
