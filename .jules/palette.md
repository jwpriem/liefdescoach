## 2026-03-31 - Global Escape Key handling for Modal Dialogs in Vue 3
**Learning:** In Vue 3 templates, `@keydown.window.escape` is invalid because `.window` is not a native `v-on` event modifier in Vue. It fails to bind to the global window object and modal dialogs remain unclosable via keyboard.
**Action:** To enable keyboard dismissal (Escape key) on custom modal components, attach window keydown listeners inside `onMounted` and detach in `onUnmounted`, verifying that the modal's open state (`modelValue` or `open`) is true before triggering the close function.
