# Specification

## Summary
**Goal:** Make prompt-based video clip generation (including runs with uploaded reference images) reliable, and fix Clips progress and preview UI so failures are clearly and accurately represented.

**Planned changes:**
- Fix Grok clip-generation request/response handling so prompt + 1 reference image runs can succeed, and failures are surfaced as clear in-app English errors (no silent empty/invalid clip URLs).
- Prevent creation of placeholder/invalid ClipData (e.g., `url: ''`) on failure; mark clips as Failed with a usable error state instead of attempting previews with empty URLs.
- Correct Clips-step overall progress calculation and labeling so it never shows 100% when 0 clips completed; show accurate completed vs failed counts and a “generation failed” label when applicable.
- Update clip preview rendering to avoid the browser’s native video “Load failed” UI by only rendering a `<video>` when a non-empty URL exists; otherwise show an in-app error UI with a Retry action.

**User-visible outcome:** Users can generate clips from a prompt (including with a reference image) and, when something goes wrong, they see clear English failure states with accurate overall progress and an in-app Retry option—without blank clips or native video “Load failed” overlays.
