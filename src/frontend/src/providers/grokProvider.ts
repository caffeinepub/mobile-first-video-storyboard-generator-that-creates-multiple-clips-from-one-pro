import { encodeImages, type EncodedImage } from '../lib/fileEncoding';
import { loadRuntimeConfig, isRuntimeConfigValid } from '../lib/grokRuntimeConfig';
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
    return {
      endpoint: ENV_GROK_API_ENDPOINT,
      apiKey: ENV_GROK_API_KEY
    };
  }
  
  // Fall back to runtime config
  const runtimeConfig = loadRuntimeConfig();
  if (isRuntimeConfigValid(runtimeConfig)) {
    return runtimeConfig;
  }
  
  return null;
}

export async function grokDeriveSegments(
  prompt: string,
  clipCount: number,
  referenceImages?: File[]
): Promise<string[]> {
  const config = getGrokConfig();
  
  if (!config) {
    throw new Error('Grok AI is not configured. Please configure Grok using the runtime settings or set VITE_GROK_API_ENDPOINT and VITE_GROK_API_KEY environment variables.');
  }

  try {
    const payload: any = {
      prompt,
      clipCount,
      task: 'derive_segments'
    };

    // Include reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      const encodedImages = await encodeImages(referenceImages);
      payload.referenceImages = encodedImages;
    }

    const response = await fetch(`${config.endpoint}/derive-segments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.segments || !Array.isArray(data.segments)) {
      throw new Error('Invalid response format from Grok API');
    }

    return data.segments;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to derive segments using Grok AI');
  }
}

export async function grokGenerateClip(
  prompt: string,
  duration: number,
  index: number,
  referenceImages?: File[]
): Promise<ClipData> {
  const config = getGrokConfig();
  
  if (!config) {
    throw new Error('Grok AI is not configured. Please configure Grok using the runtime settings or set VITE_GROK_API_ENDPOINT and VITE_GROK_API_KEY environment variables.');
  }

  try {
    const payload: any = {
      prompt,
      duration,
      index,
      task: 'generate_clip'
    };

    // Include reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      const encodedImages = await encodeImages(referenceImages);
      payload.referenceImages = encodedImages;
    }

    const response = await fetch(`${config.endpoint}/generate-clip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.url || !data.duration) {
      throw new Error('Invalid clip data from Grok API');
    }

    return {
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      prompt
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate clip using Grok AI');
  }
}
