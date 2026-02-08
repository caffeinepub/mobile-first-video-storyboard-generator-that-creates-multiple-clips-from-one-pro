import { useState, useEffect } from 'react';
import { 
  getCurrentProvider, 
  isGrokConfigured,
  type VideoProvider 
} from '../providers/videoProvider';
import { onConfigChange, isRuntimeConfigValid, loadRuntimeConfig } from '../lib/grokRuntimeConfig';
import { isCanonicalEndpoint } from '../lib/grokEndpoint';

export function useVideoProvider() {
  const [provider] = useState<VideoProvider>(getCurrentProvider());
  const [grokConfigured, setGrokConfigured] = useState(() => {
    // Initial check: Grok is configured AND endpoint is canonical
    const configured = isGrokConfigured();
    if (!configured) return false;
    
    // Also check if runtime config has canonical endpoint
    const runtimeConfig = loadRuntimeConfig();
    if (runtimeConfig) {
      return isCanonicalEndpoint(runtimeConfig.endpoint);
    }
    
    return configured;
  });

  // Subscribe to runtime config changes
  useEffect(() => {
    const unsubscribe = onConfigChange(() => {
      // Update configuration status when runtime config changes
      const newGrokConfigured = isGrokConfigured();
      
      // Also verify endpoint is canonical
      if (newGrokConfigured) {
        const runtimeConfig = loadRuntimeConfig();
        if (runtimeConfig) {
          setGrokConfigured(isCanonicalEndpoint(runtimeConfig.endpoint));
          return;
        }
      }
      
      setGrokConfigured(newGrokConfigured);
    });
    
    return unsubscribe;
  }, []);

  return {
    provider,
    isGrokConfigured: grokConfigured
  };
}
