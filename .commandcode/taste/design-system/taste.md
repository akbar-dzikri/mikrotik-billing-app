# design-system
- Use dark theme with dot grid (rgba(255,255,255,0.04) 1px dots, 28px spacing) + vignette pseudo-element overlay. Confidence: 0.95
- Use design tokens as CSS custom properties only; never hard-code color values. Confidence: 0.95
- Apply system font stack (system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif) for UI and monospace for technical elements only. Confidence: 0.95
- Use fade-up animation with cubic-bezier(0.16, 1, 0.3, 1) ease-out-expo timing; include prefers-reduced-motion media query globally. Confidence: 0.95
- Use min-h-dvh instead of min-h-screen for full-viewport height to avoid mobile address-bar issues. Confidence: 0.95
- Always constrain content wrappers with max-width; never let text stretch to screen edge on ultra-wide. Confidence: 0.95
