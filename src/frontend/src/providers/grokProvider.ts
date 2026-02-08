import { encodeImages, type EncodedImage } from '../lib/fileEncoding';
import { loadRuntimeConfig, isRuntimeConfigValid } from '../lib/grokRuntimeConfig';
import { validateAndNormalizeEndpoint } from '../lib/grokEndpoint';
import type { ClipData } from './videoProvider';

// Grok AI provider configuration from environment variables
const ENV_GROK_API_ENDPOINT = import.meta.env.VITE_GROK_API_ENDPOINT || '';
const ENV_GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || '';

export interface GrokProviderConfig {
  endpoint: string;
  apiKey: string;
}

/**
 * Unified Grok configuration getter - supports both env vars and runtime config
 * Priority: env vars first, then runtime config
 */
export function getGrokConfig(): GrokProviderConfig | null {
  // Check environment variables first
  if (ENV_GROK_API_ENDPOINT && ENV_GROK_API_KEY) {
    // Normalize env endpoint
    const validation = validateAndNormalizeEndpoint(ENV_GROK_API_ENDPOINT);
    return {
      endpoint: validation.valid ? validation.normalized! : ENV_GROK_API_ENDPOINT,
      apiKey: ENV_GROK_API_KEY
    };
  }
  
  // Fall back to runtime config
  const runtimeConfig = loadRuntimeConfig();
  if (runtimeConfig && isRuntimeConfigValid(runtimeConfig)) {
    return runtimeConfig;
  }
  
  return null;
}

/**
 * Check if Grok is configured (either via env or runtime)
 */
export function isGrokConfigured(): boolean {
  return getGrokConfig() !== null;
}

async function generateGrokVideo(
  prompt: string,
  duration: number,
  referenceImages?: File[]
): Promise<ClipData> {
  const config = getGrokConfig();
  
  if (!config) {
    throw new Error(
      'Grok AI is not configured. Please configure Grok settings (runtime configuration or environment variables) before generating videos.'
    );
  }
  
  // Validate endpoint format
  const endpointValidation = validateAndNormalizeEndpoint(config.endpoint);
  if (!endpointValidation.valid) {
    throw new Error(
      `Invalid Grok endpoint configuration: ${endpointValidation.error}. ` +
      'Please update your Grok settings with a valid endpoint URL.'
    );
  }
  
  const hasReferenceImages = referenceImages && referenceImages.length > 0;
  
  try {
    // Encode reference images if provided
    let encodedImages: EncodedImage[] | undefined;
    if (hasReferenceImages) {
      try {
        encodedImages = await encodeImages(referenceImages);
      } catch (error) {
        throw new Error(
          `Failed to process reference images: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
          'Try removing the reference images or using different image files.'
        );
      }
    }
    
    // Prepare request body
    const requestBody = {
      prompt,
      duration,
      ...(encodedImages && encodedImages.length > 0 && { referenceImages: encodedImages })
    };
    
    // Call Grok API
    const response = await fetch(endpointValidation.normalized!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const referenceImageNote = hasReferenceImages 
        ? ` Note: This request included ${referenceImages!.length} reference ${referenceImages!.length === 1 ? 'image' : 'images'}. Try generating without reference images if the issue persists.`
        : '';
      
      throw new Error(
        `Grok API request failed (${response.status} ${response.statusText}): ${errorText}.${referenceImageNote}`
      );
    }
    
    const data = await response.json();
    
    // Extract video URL from multiple possible response shapes
    let videoUrl: string | null = null;
    
    // Try direct url property
    if (data && typeof data.url === 'string' && data.url.trim() !== '') {
      videoUrl = data.url.trim();
    }
    // Try nested data.url
    else if (data && data.data && typeof data.data.url === 'string' && data.data.url.trim() !== '') {
      videoUrl = data.data.url.trim();
    }
    // Try video_url property
    else if (data && typeof data.video_url === 'string' && data.video_url.trim() !== '') {
      videoUrl = data.video_url.trim();
    }
    // Try nested data.video_url
    else if (data && data.data && typeof data.data.video_url === 'string' && data.data.video_url.trim() !== '') {
      videoUrl = data.data.video_url.trim();
    }
    
    // Validate we got a non-empty URL
    if (!videoUrl) {
      const referenceImageNote = hasReferenceImages 
        ? ` Note: This request included ${referenceImages!.length} reference ${referenceImages!.length === 1 ? 'image' : 'images'}. Try generating without reference images.`
        : '';
      
      console.error('Invalid Grok API response structure:', data);
      throw new Error(
        `Invalid response from Grok API: missing or empty video URL.${referenceImageNote}`
      );
    }
    
    // Validate URL format
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://') && !videoUrl.startsWith('blob:')) {
      const referenceImageNote = hasReferenceImages 
        ? ` Note: This request included ${referenceImages!.length} reference ${referenceImages!.length === 1 ? 'image' : 'images'}.`
        : '';
      
      throw new Error(
        `Grok API returned an invalid video URL format: "${videoUrl}". Expected a valid HTTP(S) or blob URL.${referenceImageNote}`
      );
    }
    
    const clipData: ClipData = {
      url: videoUrl,
      prompt,
      duration
    };
    
    return clipData;
  } catch (error) {
    // Ensure all errors have clear, actionable messages
    if (error instanceof Error) {
      throw error;
    }
    
    const referenceImageNote = hasReferenceImages 
      ? ` Note: This request included ${referenceImages!.length} reference ${referenceImages!.length === 1 ? 'image' : 'images'}.`
      : '';
    
    throw new Error(
      `Unexpected error during Grok video generation: ${String(error)}${referenceImageNote}`
    );
  }
}

// Export functions matching videoProvider's expected API
export async function grokDeriveSegments(
  prompt: string,
  clipCount: number,
  referenceImages?: File[]
): Promise<string[]> {
  // For now, just split the prompt into segments
  // In a real implementation, this might call a separate API endpoint
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

export async function grokGenerateClip(
  prompt: string,
  duration: number,
  index: number,
  referenceImages?: File[]
): Promise<ClipData> {
  return generateGrokVideo(prompt, duration, referenceImages);
}
