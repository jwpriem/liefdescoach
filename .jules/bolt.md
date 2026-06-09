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
## 2026-04-19 - Vue Template Render Loop Anti-Pattern
**Learning:** Avoid calling functions that sort arrays or allocate new objects (like `getLessonBookingsWithLabels(lesson.bookings)` or filtering arrays) directly inside Vue `v-for` directives in templates. This forces Vue to re-execute expensive operations and create new references on every single patch/render cycle, destroying performance.
**Action:** Move expensive data transformations out of the template and into `computed` properties (e.g., caching metrics inside a Map to maintain reference stability and prevent redundant recalculations).
## 2024-05-19 - Vue Template Render Loop Anti-Pattern
**Learning:** Avoid executing O(N) array filtering (e.g. `.filter()`) and computing strings within method calls (like `spotsLeft(lesson)`) that are invoked multiple times inside a Vue template `v-for` loop. This forces Vue to re-execute expensive iterations and allocations on every patch/render cycle for every item in the list, destroying frontend performance.
**Action:** Extract these calculations out of the template and into a memoized `computed` property (e.g., `lessonMetrics`), utilizing an O(1) `Map` keyed by the item ID to efficiently cache and look up the derived metrics directly in the template.
## 2025-05-14 - Redundant Date Allocations and Year-based Caching
**Learning:** Drizzle ORM returns timestamp columns as native JavaScript Date objects. Re-wrapping them in `new Date()` inside large loops (e.g., revenue processing) causes unnecessary heap allocations. Additionally, calculating week numbers from scratch for thousands of rows using `new Date(year, 0, 1)` can be optimized by caching start-of-year metadata.
**Action:** Always check column types in the schema before converting dates and use a low-cardinality cache (like an object keyed by year) for static date metadata in processing loops.

## 2024-05-19 - Paginated List Processing
**Learning:** When optimizing list rendering in Vue, avoid mapping over the entire collection ($O(N)$) if the UI is paginated. Processing the entire archive can cause performance regressions as the data grows.
**Action:** Slice the collection first, then map over the current page's slice ($O(M)$ where $M$ is page size) to pre-calculate formatted strings and transformations, ensuring constant time performance regardless of total collection size.

## 2025-05-20 - Server API Data Processing Efficiency
**Learning:** Extracting unique identifiers from a list of records using `[...new Set(arr.map(i => i.id))]` and building lookup Maps using `new Map(arr.map(l => [l.id, l.val]))` incurs multiple redundant traversals and unnecessary intermediate array/object allocations.
**Action:** Use single `for...of` loops to populate `Set` and `Map` objects directly. Additionally, consolidate data enrichment steps into a single loop to reduce iteration overhead and maintain reference stability for objects.

## 2024-06-09 - Server API Query Consolidation
**Learning:** Consolidating multiple database queries (e.g., fetch parent, fetch children, fetch count) into a single joined query using `leftJoin` significantly reduces database roundtrip latency, which is the primary bottleneck in serverless/distributed environments.
**Action:** Always look for opportunities to use joins instead of sequential queries in server handlers, and process the results in a single pass to derive metrics like counts or existence checks.
