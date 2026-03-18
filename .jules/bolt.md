## 2024-05-15 - Vue Component List Filtering Performance
**Learning:** Avoid using `Object.values()` within filter loops in Vue component computed properties. Instead, explicitly target known object properties. Hoist invariant calculations, such as string case conversions (`.toLowerCase()`), outside the filter loop for better performance.
**Action:** When filtering lists based on a query string, normalize the query once outside the loop.

## 2024-05-15 - Vue Component List Rendering Performance
**Learning:** Avoid executing `Array.some()` or `Array.find()` inside `v-for` loops (like `checkBooking(lesson.id)` called per iteration). This turns O(N) into O(N*M).
**Action:** Transform lookup arrays into `Set` objects within `computed` properties to ensure O(1) complexity during `v-for` iterations.

## 2024-05-18 - Vue Component Filtering Performance
**Learning:** Avoid allocating new arrays and using chained functional methods (like `.filter(Boolean).join(' ')`) inside high-frequency loop iterations like computed search filters. Doing this for every item on every keystroke causes unnecessary object allocations and garbage collection pauses.
**Action:** Use template literal string concatenation instead (e.g. `` `${x.name || ''} ${x.email || ''}` ``) to combine values efficiently inside loops.
