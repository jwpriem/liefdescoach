# Palette's Journal - Critical Learnings Only

This journal contains critical UX/accessibility learnings.

## 2026-07-28 - Custom Tab Bar Accessibility Enhancement
**Learning:** When using custom tabbed components for main page routing/navigation (e.g., bottom navigation in `AccountBottomNav.vue`), native screen readers are unaware of the navigation hierarchy and active states unless explicit WAI-ARIA attributes (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"`) are programmatically associated with their target display containers.
**Action:** Always link tab controls with their corresponding tabpanel divs using matching `id` and `aria-labelledby`/`aria-controls` properties, and assign dynamic `aria-selected` attributes representing the active slot state.
