# Palette's Journal

## 2025-02-18 - Global Keyboard Event Listeners in Vue 3
**Learning:** In Vue 3, `.window` is not a valid event modifier for `v-on` (e.g. `@keydown.window.escape` fails silently or causes template errors).
**Action:** Global keyboard listeners for modal dismissal or hotkeys must be explicitly registered via `window.addEventListener` in `onMounted` and unregistered in `onUnmounted`, verifying component visibility state before executing handlers.
