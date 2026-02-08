# Specification

## Summary
**Goal:** Eliminate browser-native validation errors during video creation and replace them with clear in-app validation and error states, especially around runtime Grok endpoint configuration and early generation failures.

**Planned changes:**
- Remove/prevent browser-native constraint validation tooltips (e.g., “The string did not match the expected pattern”) in the video creation flow and replace them with in-app validation and English error messaging.
- Validate, normalize, and gate saving of the runtime Grok endpoint (e.g., require http:// or https://, trim whitespace, remove trailing slashes) and prevent advancing when configuration is invalid/missing.
- Add clear, user-visible error states when generation cannot start or fails immediately (including failures involving reference images like IMG_0787.jpeg), keeping the user on the appropriate step with recovery guidance and without switching providers.

**User-visible outcome:** Users can configure a Grok runtime endpoint without browser popups; invalid endpoints show clear English in-app errors and won’t be saved or allow generation to proceed, and early generation failures (including with reference images) show actionable errors without leaving the flow stuck or changing the selected provider.
