import { encodeImages, type EncodedImage } from '../lib/fileEncoding';
import { loadRuntimeConfig, isRuntimeConfigValid } from '../lib/grokRuntimeConfig';
import { validateAndNormalizeEndpoint } from '../lib/grokEndpoint';
import type { ClipData } from './videoProvider';
import { validateVideoUrl, validateClipData } from '../lib/videoValidation';

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
  
  try {
    // Encode reference images if provided
    let encodedImages: EncodedImage[] | undefined;
    if (referenceImages && referenceImages.length > 0) {
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
      throw new Error(
        `Grok API request failed (${response.status}): ${errorText}. ` +
        (referenceImages && referenceImages.length > 0 
          ? 'This request included reference images. Try removing them if the issue persists.' 
          : '')
      );
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data.url !== 'string') {
      throw new Error(
        'Invalid response from Grok API: missing video URL. ' +
        (referenceImages && referenceImages.length > 0 
          ? 'This request included reference images.' 
          : '')
      );
    }
    
    // Validate that the URL points to a video
    const videoValidation = await validateVideoUrl(data.url);
    if (!videoValidation.isValid) {
      throw new Error(
        `Grok API returned an invalid video URL: ${videoValidation.error}. ` +
        'The URL does not point to a playable video file.'
      );
    }
    
    const clipData: ClipData = {
      url: data.url,
      prompt,
      duration
    };
    
    // Final validation of clip data structure
    const clipValidation = validateClipData(clipData);
    if (!clipValidation.isValid) {
      throw new Error(
        `Invalid clip data from Grok API: ${clipValidation.error}`
      );
    }
    
    return clipData;
  } catch (error) {
    // Ensure all errors have clear, actionable messages
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `Unexpected error during Grok video generation: ${String(error)}` +
      (referenceImages && referenceImages.length > 0 
        ? '. This request included reference images.' 
        : '')
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
