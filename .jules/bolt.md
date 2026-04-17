## 2024-05-15 - Vue Component List Filtering Performance
**Learning:** Avoid using `Object.values()` within filter loops in Vue component computed properties. Instead, explicitly target known object properties. Hoist invariant calculations, such as string case conversions (`.toLowerCase()`), outside the filter loop for better performance.
**Action:** When filtering lists based on a query string, normalize the query once outside the loop.

## 2024-05-15 - Vue Component List Rendering Performance
**Learning:** Avoid executing `Array.some()` or `Array.find()` inside `v-for` loops (like `checkBooking(lesson.id)` called per iteration). This turns O(N) into O(N*M).
**Action:** Transform lookup arrays into `Set` objects within `computed` properties to ensure O(1) complexity during `v-for` iterations.

## 2024-05-18 - Vue Component Filtering Performance
**Learning:** Avoid allocating new arrays and using chained functional methods (like `.filter(Boolean).join(' ')`) inside high-frequency loop iterations like computed search filters. Doing this for every item on every keystroke causes unnecessary object allocations and garbage collection pauses.
**Action:** Use template literal string concatenation instead (e.g. `` `${x.name || ''} ${x.email || ''}` ``) to combine values efficiently inside loops.

## 2024-05-18 - Vue Template Render Loop Anti-Pattern
**Learning:** Avoid calling functions that sort arrays or allocate new objects (like `getLessonBookingsWithLabels(lesson.bookings)`) directly inside Vue `v-for` directives in templates. This forces Vue to re-execute expensive operations and create new references on every single patch/render cycle, destroying performance.
**Action:** Move expensive data transformations out of the template and into `computed` properties (e.g., mapping an array to include processed properties).

## 2024-05-24 - Array Sorting Performance with ISO Date Strings
**Learning:** Calling `new Date(string).getTime()` or using `String.prototype.localeCompare()` inside array `.sort()` comparator functions is extremely slow because it requires O(N log N) costly instantiations and local culture formatting logic on every swap. ISO 8601 strings are inherently lexicographically sortable.
**Action:** Use simple `<` and `>` operators inside `.sort()` callbacks when comparing ISO date strings (e.g. `a.date < b.date ? -1 : a.date > b.date ? 1 : 0`).
## 2026-04-08 - Vue Computed Array Consolidations
**Learning:** Chained array methods like `.map().filter().forEach()` inside computed properties can be highly inefficient in Vue. Doing `.map(item => ({ ...item, ... }))` creates intermediate arrays and allocates new throwaway objects for every single item, even for those that are immediately discarded by the subsequent `.filter()`. This causes unnecessary memory usage, garbage collection, and breaks Vue's reactive proxies.
**Action:** Consolidate multiple array operations (`.map`, `.filter`, `.forEach`) into a single `for...of` or `.reduce()` loop. Only allocate new objects or spread properties for items that *pass* the conditional checks, thereby turning O(k*N) time and memory operations into O(N).

## 2025-02-28 - Map Construction from Arrays
**Learning:** Passing a chained `.filter().map()` expression directly into the `new Map()` constructor (e.g. `new Map(arr.filter(c).map(t))`) iterates the array multiple times and creates unnecessary intermediate array allocations before the Map is even built.
**Action:** Instantiate an empty Map and populate it using a single `for...of` loop to prevent intermediate allocations and turn O(k*N) operations into O(N).
