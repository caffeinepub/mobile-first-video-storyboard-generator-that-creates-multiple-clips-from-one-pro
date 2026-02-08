# Specification

## Summary
**Goal:** Make video generation and previewing more reliable and user-friendly by replacing native video load errors with stable in-app error states, improving the “Generation Failed” flow, and showing an in-progress Grok live view during clip generation.

**Planned changes:**
- Replace browser-native `<video>` failure UI (“load failed”) for clip and composed video previews with in-app error states that include clear English messaging and retry actions.
- Prevent preview components from rendering `<video>` when the video URL is empty/invalid to avoid spurious load errors.
- Update the “Generation Failed” screen to be concise and actionable with a primary recovery action (Back to Prompt / Try Again), and hide technical error details behind an explicit disclosure.
- Add a “Grok (live view)” section during clip generation that attempts to embed https://grok.com, with an in-app fallback message and “Open Grok in a new tab” button if embedding is blocked; hide this section outside the generation phase.

**User-visible outcome:** Users no longer see disruptive native “load failed” video UI; instead they get clear in-app error states with retry/recovery paths, and they can view an in-progress Grok website panel (or open Grok in a new tab) while clips are generating.
