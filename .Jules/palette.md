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
## 2024-05-18 - Missing Alt Attributes on Images
**Learning:** Found that many `<img>` tags across the site (like hero images and landing page photos) were missing `alt` attributes. Nuxt components wrapping images (like `<Header>`) also lacked a way to pass `alt` down. This meant screen readers had no context for these images.
**Action:** Added `alt` props to wrapping components and applied meaningful `alt` text to informative images across the site. For decorative images, an empty `alt=""` is used to skip them in screen readers.
## 2024-05-18 - Replacing interactive spans and icons with buttons
**Learning:** Found `<span @click="...">` and `<UIcon @click="...">` elements in `AccountLessons.vue`. Non-interactive elements with click handlers are completely inaccessible to keyboard users (cannot be tabbed to or activated with Enter/Space) and are not announced correctly by screen readers.
**Action:** Always use `<button>` or `<a>` (or `NuxtLink`) for interactive elements. Ensure they have appropriate `aria-label`s if they are icon-only, and include `focus-visible` utility classes for clear keyboard focus states.
## 2024-05-18 - Replacing interactive divs with buttons for mobile toggles
**Learning:** Found mobile navigation toggles implemented as `<div @click="...">` elements without `role="button"` or `tabindex="0"`. These are completely inaccessible to keyboard users and are not announced by screen readers as interactive. Even if spans are documented, main navigation structural `div`s need explicit attention.
**Action:** When inspecting navigation structures, ensure that interactive elements intended to act as toggles are strictly `<button>` elements (or `<a>`/`<NuxtLink>`) with appropriate `aria-label` attributes and clear `focus-visible` styling.
## 2024-05-18 - Replacing interactive list items with semantic elements
**Learning:** Found `<li @click="...">` elements used for navigation and actions in `NavYoga.vue` and `NavLiefdescoach.vue`. Placing click handlers on non-interactive `<li>` elements prevents keyboard users from focusing and activating them, creating an accessibility barrier.
**Action:** Always move `@click` handlers from `<li>` elements down to their natively focusable and interactive children (such as `<a>`, `<nuxt-link>`, or `<button>`).

## 2024-05-19 - Ensure tooltips display on disabled Nuxt UI buttons
**Learning:** In Nuxt UI (and common component libraries), disabled `<UButton>` elements block pointer events, preventing wrapper components like `<UTooltip>` from registering hover states. This leads to hidden context about *why* the button is disabled.
**Action:** When an action is unavailable, always show the disabled button and explicitly wrap it in a structural `<div>` so the surrounding `<UTooltip>` can properly catch pointer events and explain the disabled state to the user.
## 2025-04-12 - Wrap disabled UButton in div for tooltips
**Learning:** In Nuxt UI (and common component libraries), disabled `<UButton>` elements block pointer events, preventing wrapper components like `<UTooltip>` from registering hover states. This leads to hidden context about *why* the button is disabled.
**Action:** When an action is unavailable, always show the disabled button and explicitly wrap it in a structural `<div>` so the surrounding `<UTooltip>` can properly catch pointer events and explain the disabled state to the user.

## 2025-04-12 - Wrapping disabled buttons with tooltips
**Learning:** I noticed that several disabled buttons in the login and password reset pages did not have any tooltips explaining why they were disabled (e.g., waiting for input). This leaves users confused about what is required to proceed.
**Action:** Wrapped these disabled buttons with `<UTooltip>` elements and explicitly wrapped the `<UButton>` in a structural `<div>` so the surrounding `<UTooltip>` can catch pointer events and display the context for the disabled state to the user.
## 2026-04-20 - Adding Tooltips to disabled Nuxt UI buttons
**Learning:** Found disabled `<UButton>` in `NewStudentForm.vue` that blocked form submission without explaining what fields were missing. By wrapping disabled buttons in a structural `<div>`, we can allow wrapper components like `<UTooltip>` to catch hover states and provide context to users on why an action is blocked.
**Action:** When a button action is blocked due to missing input, always provide clear context using a `<UTooltip>` explaining what action needs to be completed, and remember to wrap disabled `<UButton>`s in a structural `<div>` since disabled elements don't trigger pointer events.
