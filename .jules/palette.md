# Palette's Journal

## 2025-06-09 - Consistent visual hierarchy and accessibility
**Learning:** Nuxt UI `USwitch` and `UInput` components require explicit `aria-label` or `id`/`for` associations to be fully accessible to screen readers. Additionally, providing leading icons for identity fields (`user`, `phone`, `calendar`) and action icons for primary tasks (`pencil`) significantly improves the scannability and intuitive feel of the profile management interface.
**Action:** Always verify `aria-label` or `id` on switches and use the `icon` prop on `UInput` and `UButton` for core user identity and editing actions.
