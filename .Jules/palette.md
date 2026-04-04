## 2024-05-18 - Added ARIA labels to Icon-only buttons
**Learning:** Found several icon-only buttons (like modal close buttons and the delete booking button in the archive) that were missing `aria-label`s. Because these buttons only contained SVGs without text, screen readers would not be able to announce their purpose, creating an accessibility barrier.
**Action:** Next time inspecting components, always check buttons containing only SVGs. If they have no visible text, an `aria-label` in the appropriate language (Dutch for this project) must be added to describe the button's action (e.g., "Sluiten", "Verwijder boeking").
## 2025-03-18 - Missing ARIA Labels on Icon-only Nuxt UI Buttons
**Learning:** Nuxt UI's `<UButton>` component does not automatically generate accessible names when only the `icon` prop is used without text content (slots). This pattern is prevalent in this application's tables and cards (e.g., `AccountUsers.vue`, `AccountLessons.vue`), resulting in inaccessible buttons for screen readers.
**Action:** When implementing or reviewing icon-only `<UButton>` components, explicitly check for and add an `aria-label` attribute describing the button's action.

## 2024-03-27 - Disabled Button Clarity
**Learning:** Users often encounter disabled buttons in account management without clear explanations (e.g. canceling lessons or booking extra spots when out of credits).
**Action:** Always wrap disabled action buttons with a UTooltip to provide context on why the action is unavailable, reducing user frustration.
## 2024-05-19 - Adding ARIA labels to structural container buttons
**Learning:** Container-level structural buttons (e.g. quick action tiles acting as buttons with nested spans and decorative icons) in this project lacked distinct accessible names for screen readers. The text within internal spans may not be correctly identified or may be announced out-of-order.
**Action:** When a `<button>` wraps a complex internal structure (like decorative SVGs and multiple text spans), explicitly set an `aria-label` on the `<button>` and mark decorative children with `aria-hidden="true"`.

## 2024-06-12 - Ensure tooltips display on disabled Nuxt UI buttons
**Learning:** In Nuxt UI (and common component libraries), disabled `<UButton>` elements block pointer events, preventing wrapper components like `<UTooltip>` from registering hover states. This leads to hidden context about *why* the button is disabled.
**Action:** When an action is unavailable, always show the disabled button and explicitly wrap it in a structural `<div>` so the surrounding `<UTooltip>` can properly catch pointer events and explain the disabled state to the user.

## 2024-04-04 - Fixed tabindex="-1" on interactive buttons
**Learning:** Adding `tabindex="-1"` to buttons that are essential for auxiliary form workflows (like "Forgot password" or "Register") completely breaks keyboard navigation, preventing users from reaching these interactions without a mouse.
**Action:** Never use `tabindex="-1"` on interactive elements unless they are explicitly meant to be unreachable via keyboard (e.g., hidden or part of a managed focus group). Always rely on the native focusability of `<button>` and test tab order and visible focus states.
