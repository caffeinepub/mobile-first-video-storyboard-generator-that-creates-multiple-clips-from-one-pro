/**
 * Robust download utility for video files
 * Handles both Blob URLs and remote URLs with proper error handling
 */

export interface DownloadResult {
  success: boolean;
  error?: string;
}

/**
 * Download a video file from a URL (Blob URL or remote URL)
 * @param url - The URL to download from
 * @param filename - The desired filename for the download
 * @returns Promise with success/error result
 */
export async function downloadVideo(url: string, filename: string): Promise<DownloadResult> {
  try {
    let blobUrl: string;
    let shouldRevoke = false;

    // Check if it's already a Blob URL
    if (url.startsWith('blob:')) {
      blobUrl = url;
    } else {
      // Fetch remote URL as blob
      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });

        if (!response.ok) {
          return {
            success: false,
            error: `Failed to fetch video: ${response.status} ${response.statusText}`
          };
        }

        const blob = await response.blob();
        
        // Infer correct extension from Content-Type if possible
        const contentType = response.headers.get('content-type') || blob.type;
        const inferredFilename = ensureVideoExtension(filename, contentType);
        
        blobUrl = URL.createObjectURL(blob);
        shouldRevoke = true;
        filename = inferredFilename;
      } catch (fetchError) {
        if (fetchError instanceof TypeError) {
          return {
            success: false,
            error: 'Network error: Unable to download video. This may be due to CORS restrictions or network connectivity issues.'
          };
        }
        return {
          success: false,
          error: `Failed to download video: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
        };
      }
    }

    // Trigger download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up blob URL if we created it
    if (shouldRevoke) {
      // Delay revocation to ensure download starts
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Ensure filename has a proper video extension based on content type
 */
function ensureVideoExtension(filename: string, contentType: string): string {
  const extensionMap: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogg',
    'video/quicktime': '.mov'
  };

  // Check if filename already has an extension
  const hasExtension = /\.(mp4|webm|ogg|mov)$/i.test(filename);
  if (hasExtension) {
    return filename;
  }

  // Try to infer from content type
  const extension = extensionMap[contentType.toLowerCase()] || '.mp4';
  return filename + extension;
}
