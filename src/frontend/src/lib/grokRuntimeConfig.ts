// Client-side runtime Grok configuration management

const GROK_ENDPOINT_KEY = 'grok-api-endpoint';
const GROK_API_KEY_KEY = 'grok-api-key';
const CONFIG_CHANGE_EVENT = 'grok-config-changed';

export interface RuntimeGrokConfig {
  endpoint: string;
  apiKey: string;
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
 * Save runtime Grok configuration to localStorage
 */
export function saveRuntimeConfig(endpoint: string, apiKey: string): void {
  try {
    localStorage.setItem(GROK_ENDPOINT_KEY, endpoint.trim());
    localStorage.setItem(GROK_API_KEY_KEY, apiKey.trim());
    
    // Notify app of config change
    window.dispatchEvent(new CustomEvent(CONFIG_CHANGE_EVENT));
  } catch (error) {
    console.error('Failed to save runtime Grok config:', error);
    throw new Error('Failed to save configuration');
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
  return !!(config && config.endpoint.trim() && config.apiKey.trim());
}

/**
 * Subscribe to runtime config changes
 */
export function subscribeToConfigChanges(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CONFIG_CHANGE_EVENT, handler);
  
  // Return unsubscribe function
  return () => window.removeEventListener(CONFIG_CHANGE_EVENT, handler);
}
