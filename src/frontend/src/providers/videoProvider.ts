import { grokDeriveSegments, grokGenerateClip, getGrokConfig } from './grokProvider';

export interface ClipData {
  url: string;
  thumbnailUrl?: string;
  duration: number;
  prompt: string;
}

export type VideoProvider = 'grok' | 'demo';

const PROVIDER_STORAGE_KEY = 'video-provider-selection';
const EXPLICIT_DEMO_OPT_IN_KEY = 'explicit-demo-opt-in';

let currentProvider: VideoProvider = 'demo';

/**
 * Check if Grok is configured (env vars OR runtime config)
 * Uses unified config getter as single source of truth
 */
export function isGrokConfigured(): boolean {
  const grokConfig = getGrokConfig();
  return !!grokConfig;
}

/**
 * Check if user has explicitly opted into Demo mode while Grok was available
 */
function hasExplicitDemoOptIn(): boolean {
  try {
    return localStorage.getItem(EXPLICIT_DEMO_OPT_IN_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Set explicit Demo opt-in flag
 */
function setExplicitDemoOptIn(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(EXPLICIT_DEMO_OPT_IN_KEY, 'true');
    } else {
      localStorage.removeItem(EXPLICIT_DEMO_OPT_IN_KEY);
    }
  } catch (error) {
    console.warn('Failed to set explicit Demo opt-in:', error);
  }
}

/**
 * Clean up stale localStorage provider selection if it conflicts with current state
 */
function cleanupStaleProviderSelection(): void {
  try {
    const storedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY);
    const grokConfigured = isGrokConfigured();
    const explicitDemoOptIn = hasExplicitDemoOptIn();
    
    // If stored provider is 'demo' but there's no explicit opt-in and Grok is configured,
    // remove the stale selection so it doesn't interfere
    if (storedProvider === 'demo' && !explicitDemoOptIn && grokConfigured) {
      localStorage.removeItem(PROVIDER_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to cleanup stale provider selection:', error);
  }
}

// Initialize provider based on configuration and persisted selection
function initializeProvider(): VideoProvider {
  // First, clean up any stale localStorage entries
  cleanupStaleProviderSelection();
  
  const grokConfigured = isGrokConfigured();
  const explicitDemoOptIn = hasExplicitDemoOptIn();
  
  // If Grok is configured and user hasn't explicitly opted into Demo, use Grok
  if (grokConfigured && !explicitDemoOptIn) {
    return 'grok';
  }
  
  // Otherwise use Demo (either Grok not configured, or explicit Demo opt-in)
  return 'demo';
}

currentProvider = initializeProvider();

export function getCurrentProvider(): VideoProvider {
  return currentProvider;
}

export function setCurrentProvider(provider: VideoProvider): void {
  const grokConfigured = isGrokConfigured();
  
  // Prevent setting Grok if not configured
  if (provider === 'grok' && !grokConfigured) {
    console.warn('Cannot set provider to Grok: not configured');
    return;
  }
  
  currentProvider = provider;
  
  // Handle explicit Demo opt-in tracking
  if (provider === 'demo' && grokConfigured) {
    // User is choosing Demo while Grok is available - record explicit opt-in
    setExplicitDemoOptIn(true);
  } else if (provider === 'grok') {
    // User is choosing Grok - clear explicit Demo opt-in
    setExplicitDemoOptIn(false);
  }
  // If Demo is chosen while Grok is NOT configured, don't set opt-in flag
  // (this is just a fallback, not an explicit choice)
  
  // Persist selection only if it's a valid choice
  try {
    if (provider === 'grok' && grokConfigured) {
      localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
    } else if (provider === 'demo') {
      // Only persist demo if it's an explicit choice (Grok is configured)
      if (grokConfigured) {
        localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
      }
      // Don't persist demo as fallback when Grok is unavailable
    }
  } catch (error) {
    console.warn('Failed to persist provider selection:', error);
  }
}

/**
 * Auto-switch to Grok if it becomes configured and user hasn't explicitly opted into Demo
 * Called when runtime config changes
 */
export function reconcileProviderOnConfigChange(): void {
  const grokConfigured = isGrokConfigured();
  const explicitDemoOptIn = hasExplicitDemoOptIn();
  
  // Clean up stale selections first
  cleanupStaleProviderSelection();
  
  // If Grok just became configured and user hasn't explicitly opted into Demo,
  // switch to Grok automatically
  if (grokConfigured && !explicitDemoOptIn && currentProvider === 'demo') {
    currentProvider = 'grok';
    try {
      localStorage.setItem(PROVIDER_STORAGE_KEY, 'grok');
    } catch (error) {
      console.warn('Failed to persist provider selection:', error);
    }
  }
  
  // If Grok became unavailable, fall back to Demo (but don't set explicit opt-in)
  if (!grokConfigured && currentProvider === 'grok') {
    currentProvider = 'demo';
    setExplicitDemoOptIn(false);
  }
}

export function isUsingDemoMode(): boolean {
  return currentProvider === 'demo';
}

export function getExplicitDemoOptIn(): boolean {
  return hasExplicitDemoOptIn();
}

// Demo provider implementation
async function demoDeriveSegments(prompt: string, clipCount: number): Promise<string[]> {
  const segments: string[] = [];
  const words = prompt.split(' ');
  const wordsPerSegment = Math.ceil(words.length / clipCount);
  
  for (let i = 0; i < clipCount; i++) {
    const start = i * wordsPerSegment;
    const end = Math.min(start + wordsPerSegment, words.length);
    const segmentWords = words.slice(start, end);
    
    if (segmentWords.length > 0) {
      segments.push(`Scene ${i + 1}: ${segmentWords.join(' ')}`);
    } else {
      segments.push(`Scene ${i + 1}: Continuation of the story`);
    }
  }
  
  return segments;
}

async function demoGenerateClip(
  prompt: string,
  duration: number,
  index: number
): Promise<ClipData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Create a canvas-based video
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  // Generate a unique color based on index
  const hue = (index * 137.5) % 360;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
  gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 30%)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  
  const lines = wrapText(ctx, prompt, canvas.width - 100);
  const lineHeight = 60;
  const startY = (canvas.height - lines.length * lineHeight) / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });
  
  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/jpeg', 0.9);
  });
  
  const thumbnailUrl = URL.createObjectURL(blob);
  
  return {
    url: thumbnailUrl,
    thumbnailUrl,
    duration,
    prompt
  };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Public API with provider routing - no automatic fallback
export async function deriveSegments(
  prompt: string,
  clipCount: number,
  referenceImages?: File[]
): Promise<string[]> {
  if (currentProvider === 'grok') {
    return await grokDeriveSegments(prompt, clipCount, referenceImages);
  }
  
  return demoDeriveSegments(prompt, clipCount);
}

export async function generateClip(
  prompt: string,
  duration: number,
  index: number,
  referenceImages?: File[]
): Promise<ClipData> {
  if (currentProvider === 'grok') {
    return await grokGenerateClip(prompt, duration, index, referenceImages);
  }
  
  return demoGenerateClip(prompt, duration, index);
}
