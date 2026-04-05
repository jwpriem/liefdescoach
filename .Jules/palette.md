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
## 2024-05-18 - Missing Alt Attributes on Images
**Learning:** Found that many `<img>` tags across the site (like hero images and landing page photos) were missing `alt` attributes. Nuxt components wrapping images (like `<Header>`) also lacked a way to pass `alt` down. This meant screen readers had no context for these images.
**Action:** Added `alt` props to wrapping components and applied meaningful `alt` text to informative images across the site. For decorative images, an empty `alt=""` is used to skip them in screen readers.
