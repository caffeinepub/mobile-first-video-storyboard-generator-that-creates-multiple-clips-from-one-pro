# Specification

## Summary
**Goal:** Automatically use Grok (normal mode) whenever Grok configuration is available, without getting stuck in Demo mode due to a previously persisted provider choice unless the user explicitly opted into Demo mode.

**Planned changes:**
- Update provider selection logic to prefer Grok on page load when Grok configuration is detected via env vars or saved runtime config.
- If a persisted provider is "demo", auto-switch to Grok when Grok is configured unless an explicit Demo opt-in flag is present.
- Persist and honor an explicit Demo opt-in so that user-chosen Demo mode is not overridden by auto-switching while Grok is configured.
- When Grok configuration becomes available at runtime, immediately switch the active provider to Grok unless the user explicitly opted into Demo mode.
- Ensure all user-facing provider/configuration messaging remains in English.

**User-visible outcome:** When Grok is configured, the app shows Grok as the active provider by default (including after reloads), and it only stays in Demo mode if the user explicitly chose Demo mode.
