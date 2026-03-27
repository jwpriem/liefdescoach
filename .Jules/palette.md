## 2024-05-18 - Added ARIA labels to Icon-only buttons
**Learning:** Found several icon-only buttons (like modal close buttons and the delete booking button in the archive) that were missing `aria-label`s. Because these buttons only contained SVGs without text, screen readers would not be able to announce their purpose, creating an accessibility barrier.
**Action:** Next time inspecting components, always check buttons containing only SVGs. If they have no visible text, an `aria-label` in the appropriate language (Dutch for this project) must be added to describe the button's action (e.g., "Sluiten", "Verwijder boeking").
## 2025-03-18 - Missing ARIA Labels on Icon-only Nuxt UI Buttons
**Learning:** Nuxt UI's `<UButton>` component does not automatically generate accessible names when only the `icon` prop is used without text content (slots). This pattern is prevalent in this application's tables and cards (e.g., `AccountUsers.vue`, `AccountLessons.vue`), resulting in inaccessible buttons for screen readers.
**Action:** When implementing or reviewing icon-only `<UButton>` components, explicitly check for and add an `aria-label` attribute describing the button's action.

## 2024-03-27 - Disabled Button Clarity
**Learning:** Users often encounter disabled buttons in account management without clear explanations (e.g. canceling lessons or booking extra spots when out of credits).
**Action:** Always wrap disabled action buttons with a UTooltip to provide context on why the action is unavailable, reducing user frustration.
