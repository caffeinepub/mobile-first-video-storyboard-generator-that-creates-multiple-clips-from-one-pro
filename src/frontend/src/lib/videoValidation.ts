/**
 * Video validation utilities
 * Validates that URLs point to playable video content
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate that a URL is likely a playable video
 * @param url - The URL to validate
 * @returns Promise with validation result
 */
export async function validateVideoUrl(url: string): Promise<ValidationResult> {
  // Check URL scheme
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('blob:')) {
    return {
      isValid: false,
      error: 'Invalid URL scheme. Expected http://, https://, or blob:'
    };
  }

  // For blob URLs, we can't easily validate without loading
  if (url.startsWith('blob:')) {
    return { isValid: true };
  }

  // Try to fetch headers to check content type
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `Video URL returned ${response.status} ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('video/')) {
      return {
        isValid: false,
        error: `URL does not point to a video (Content-Type: ${contentType})`
      };
    }

    return { isValid: true };
  } catch (error) {
    // If HEAD request fails, try a more permissive check
    return await validateVideoUrlWithElement(url);
  }
}

/**
 * Validate video URL by attempting to load it in a video element
 * @param url - The URL to validate
 * @returns Promise with validation result
 */
async function validateVideoUrlWithElement(url: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const timeout = setTimeout(() => {
      video.src = '';
      resolve({
        isValid: false,
        error: 'Video validation timed out. The URL may not be accessible or may not contain valid video data.'
      });
    }, 5000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      video.src = '';
      resolve({ isValid: true });
    };

    video.onerror = () => {
      clearTimeout(timeout);
      video.src = '';
      resolve({
        isValid: false,
        error: 'Failed to load video. The URL may not contain valid video data or may not be accessible due to CORS restrictions.'
      });
    };

    video.src = url;
  });
}

/**
 * Check if a ClipData object has required fields
 */
export function validateClipData(clip: any): ValidationResult {
  if (!clip) {
    return { isValid: false, error: 'Clip data is missing' };
  }

  if (!clip.url || typeof clip.url !== 'string') {
    return { isValid: false, error: 'Clip URL is missing or invalid' };
  }

  if (clip.duration === undefined || typeof clip.duration !== 'number' || clip.duration <= 0) {
    return { isValid: false, error: 'Clip duration is missing or invalid' };
  }

  if (!clip.prompt || typeof clip.prompt !== 'string') {
    return { isValid: false, error: 'Clip prompt is missing or invalid' };
  }

  return { isValid: true };
}
