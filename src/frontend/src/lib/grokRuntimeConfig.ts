// Client-side runtime Grok configuration management

import { validateAndNormalizeEndpoint, CANONICAL_GROK_ENDPOINT, isCanonicalEndpoint } from './grokEndpoint';

const GROK_ENDPOINT_KEY = 'grok-api-endpoint';
const GROK_API_KEY_KEY = 'grok-api-key';
const CONFIG_CHANGE_EVENT = 'grok-config-changed';

export interface RuntimeGrokConfig {
  endpoint: string;
  apiKey: string;
}

export interface SaveConfigResult {
  success: boolean;
  error?: string;
}

/**
 * Load runtime Grok configuration from localStorage
 */
export function loadRuntimeConfig(): RuntimeGrokConfig | null {
  try {
    const endpoint = localStorage.getItem(GROK_ENDPOINT_KEY);
    const apiKey = localStorage.getItem(GROK_API_KEY_KEY);
    
    if (endpoint && apiKey && endpoint.trim() && apiKey.trim()) {
      return {
        endpoint: endpoint.trim(),
        apiKey: apiKey.trim()
      };
    }
  } catch (error) {
    console.warn('Failed to load runtime Grok config:', error);
  }
  
  return null;
}

/**
 * Save runtime Grok configuration to localStorage with validation
 */
export function saveRuntimeConfig(endpoint: string, apiKey: string): SaveConfigResult {
  // Validate API key
  const trimmedApiKey = apiKey.trim();
  if (!trimmedApiKey) {
    return {
      success: false,
      error: 'API key is required'
    };
  }
  
  // Validate and normalize endpoint
  const validation = validateAndNormalizeEndpoint(endpoint);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }
  
  try {
    // Save the normalized endpoint (without trailing slash)
    localStorage.setItem(GROK_ENDPOINT_KEY, validation.normalized!);
    localStorage.setItem(GROK_API_KEY_KEY, trimmedApiKey);
    
    // Notify app of config change
    window.dispatchEvent(new CustomEvent(CONFIG_CHANGE_EVENT));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save runtime Grok config:', error);
    return {
      success: false,
      error: 'Failed to save configuration to browser storage'
    };
  }
}

/**
 * Clear runtime Grok configuration from localStorage
 */
export function clearRuntimeConfig(): void {
  try {
    localStorage.removeItem(GROK_ENDPOINT_KEY);
    localStorage.removeItem(GROK_API_KEY_KEY);
    
    // Notify app of config change
    window.dispatchEvent(new CustomEvent(CONFIG_CHANGE_EVENT));
  } catch (error) {
    console.warn('Failed to clear runtime Grok config:', error);
  }
}

/**
 * Check if runtime config is valid (non-empty strings)
 */
export function isRuntimeConfigValid(config: RuntimeGrokConfig | null): boolean {
  if (!config || !config.endpoint.trim() || !config.apiKey.trim()) {
    return false;
  }
  
  // Also validate endpoint format
  const validation = validateAndNormalizeEndpoint(config.endpoint);
  return validation.valid;
}

/**
 * Check if the saved endpoint is a legacy/incorrect endpoint
 */
export function hasLegacyEndpoint(): boolean {
  const config = loadRuntimeConfig();
  if (!config) return false;
  
  return !isCanonicalEndpoint(config.endpoint);
}

/**
 * Get a message describing the legacy endpoint issue
 */
export function getLegacyEndpointMessage(): string | null {
  const config = loadRuntimeConfig();
  if (!config) return null;
  
  if (!isCanonicalEndpoint(config.endpoint)) {
    return `Your saved Grok endpoint (${config.endpoint}) should be updated to ${CANONICAL_GROK_ENDPOINT} for proper functionality.`;
  }
  
  return null;
}

/**
 * Listen for config changes
 */
export function onConfigChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CONFIG_CHANGE_EVENT, handler);
  
  // Return cleanup function
  return () => window.removeEventListener(CONFIG_CHANGE_EVENT, handler);
}
