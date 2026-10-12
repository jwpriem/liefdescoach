# Palette's UX & Accessibility Journal

This journal documents critical UX and accessibility learnings, patterns, and guidelines discovered while working on this application.

## 2025-02-19 - Clickable Settings Row Toggle Labels
**Learning:** In settings forms containing toggles (such as `@nuxt/ui` `USwitch`), users frequently attempt to click the descriptive label or the surrounding row container rather than trying to hit the tiny switch toggle button directly. Standardizing on wrapping the entire row in a `<label>` element styled with `cursor-pointer` dramatically increases the interactive target area (improving Fitts's Law suitability) and improves accessibility when paired with explicit `id`/`for` programmatic linkage.
**Action:** Always convert toggle container `div`s into `<label>` elements, assign a unique `id` to the `USwitch`, specify a matching `for` attribute on the `<label>`, and apply `cursor-pointer` to indicate clickability.
