// Utility to validate and normalize Grok API endpoints

export interface EndpointValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

// Canonical Grok API endpoint
export const CANONICAL_GROK_ENDPOINT = 'https://api.x.ai/v1';

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
    
    // Special handling for xAI endpoints - normalize to canonical
    if (url.hostname === 'api.x.ai' && url.pathname.startsWith('/v1')) {
      normalized = CANONICAL_GROK_ENDPOINT;
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
      error: `Invalid endpoint URL format. Please enter a valid URL (e.g., ${CANONICAL_GROK_ENDPOINT})`
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

/**
 * Check if an endpoint is the canonical Grok endpoint
 */
export function isCanonicalEndpoint(endpoint: string): boolean {
  const validation = validateAndNormalizeEndpoint(endpoint);
  return validation.valid && validation.normalized === CANONICAL_GROK_ENDPOINT;
}
