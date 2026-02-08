import { grokDeriveSegments, grokGenerateClip, getGrokConfig } from './grokProvider';

export interface ClipData {
  url: string;
  thumbnailUrl?: string;
  duration: number;
  prompt: string;
}

export type VideoProvider = 'grok';

/**
 * Check if Grok is configured (env vars OR runtime config)
 * Uses unified config getter as single source of truth
 */
export function isGrokConfigured(): boolean {
  const grokConfig = getGrokConfig();
  return !!grokConfig;
}

// Always use Grok - no demo mode
const currentProvider: VideoProvider = 'grok';

export function getCurrentProvider(): VideoProvider {
  return currentProvider;
}

export function isUsingDemoMode(): boolean {
  return false;
}

// Public API - always uses Grok
export async function deriveSegments(
  prompt: string,
  clipCount: number,
  referenceImages?: File[]
): Promise<string[]> {
  return grokDeriveSegments(prompt, clipCount, referenceImages);
}

export async function generateClip(
  prompt: string,
  duration: number,
  index: number,
  referenceImages?: File[]
): Promise<ClipData> {
  return grokGenerateClip(prompt, duration, index, referenceImages);
}
