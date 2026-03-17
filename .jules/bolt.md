## 2024-05-15 - Vue Component List Filtering Performance
**Learning:** Avoid using `Object.values()` within filter loops in Vue component computed properties. Instead, explicitly target known object properties. Hoist invariant calculations, such as string case conversions (`.toLowerCase()`), outside the filter loop for better performance.
**Action:** When filtering lists based on a query string, normalize the query once outside the loop.

## 2024-05-15 - Vue Component List Rendering Performance
**Learning:** Avoid executing `Array.some()` or `Array.find()` inside `v-for` loops (like `checkBooking(lesson.id)` called per iteration). This turns O(N) into O(N*M).
**Action:** Transform lookup arrays into `Set` objects within `computed` properties to ensure O(1) complexity during `v-for` iterations.
