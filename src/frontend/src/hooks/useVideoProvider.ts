import { useState, useEffect } from 'react';
import { 
  getCurrentProvider, 
  setCurrentProvider, 
  isGrokConfigured,
  reconcileProviderOnConfigChange,
  getExplicitDemoOptIn,
  type VideoProvider 
} from '../providers/videoProvider';
import { subscribeToConfigChanges } from '../lib/grokRuntimeConfig';

export function useVideoProvider() {
  const [provider, setProvider] = useState<VideoProvider>(getCurrentProvider());
  const [grokConfigured, setGrokConfigured] = useState(isGrokConfigured());
  const [explicitDemoOptIn, setExplicitDemoOptIn] = useState(getExplicitDemoOptIn());

  // Initial reconciliation on mount to ensure provider state is correct
  useEffect(() => {
    // Reconcile provider state immediately on mount
    // This handles cases where Grok is already configured but provider state is stale
    reconcileProviderOnConfigChange();
    
    // Update local state to reflect any changes from reconciliation
    setProvider(getCurrentProvider());
    setGrokConfigured(isGrokConfigured());
    setExplicitDemoOptIn(getExplicitDemoOptIn());
  }, []);

  // Subscribe to runtime config changes
  useEffect(() => {
    const unsubscribe = subscribeToConfigChanges(() => {
      // Update configuration status when runtime config changes
      const newGrokConfigured = isGrokConfigured();
      setGrokConfigured(newGrokConfigured);
      
      // Reconcile provider state: auto-switch to Grok if it became configured
      // and user hasn't explicitly opted into Demo
      reconcileProviderOnConfigChange();
      
      // Update local state to reflect any provider changes
      setProvider(getCurrentProvider());
      setExplicitDemoOptIn(getExplicitDemoOptIn());
    });
    
    return unsubscribe;
  }, []);

  const handleProviderChange = (newProvider: VideoProvider) => {
    // Prevent selecting Grok if not configured
    if (newProvider === 'grok' && !grokConfigured) {
      return;
    }
    
    setCurrentProvider(newProvider);
    setProvider(newProvider);
    setExplicitDemoOptIn(getExplicitDemoOptIn());
  };

  return {
    provider,
    setProvider: handleProviderChange,
    isGrokConfigured: grokConfigured,
    explicitDemoOptIn
  };
}
