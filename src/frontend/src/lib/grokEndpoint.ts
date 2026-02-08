// Utility to validate and normalize Grok API endpoints

export interface EndpointValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validate and normalize a Grok API endpoint
 * Returns normalized endpoint or error message
 */
export function validateAndNormalizeEndpoint(endpoint: string): EndpointValidationResult {
  // Trim whitespace
  const trimmed = endpoint.trim();
  
  if (!trimmed) {
    return {
      valid: false,
      error: 'Endpoint URL is required'
    };
  }
  
  // Check if it starts with http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return {
      valid: false,
      error: 'Endpoint must start with http:// or https://'
    };
  }
  
  // Try to parse as URL to validate format
  try {
    const url = new URL(trimmed);
    
    // Ensure it has a valid hostname
    if (!url.hostname) {
      return {
        valid: false,
        error: 'Invalid endpoint URL format'
      };
    }
    
    // Normalize: remove trailing slash from pathname if present
    let normalized = url.origin + url.pathname;
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    // Add back search params if any
    if (url.search) {
      normalized += url.search;
    }
    
    return {
      valid: true,
      normalized
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid endpoint URL format. Please enter a valid URL (e.g., https://api.example.com/v1/generate)'
    };
  }
}

/**
 * Quick check if endpoint looks valid (for UI hints)
 */
export function isEndpointFormatValid(endpoint: string): boolean {
  const trimmed = endpoint.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}
