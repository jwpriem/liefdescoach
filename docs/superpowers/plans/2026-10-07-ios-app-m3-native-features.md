# iOS App Milestone 3 — Native Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The iOS app adds a booked lesson to the phone's calendar, gives haptic feedback on booking actions, shares a lesson through the iOS share sheet, opens member links from email directly in the app, and no longer depends on a third-party server for its icons.

**Architecture:** Lesson title, address and calendar-link logic that is copied in three places moves into one module shared by server and client (`shared/lesson.ts`). Each native feature is a small util in `app/utils/` that loads its Capacitor plugin on demand and degrades silently where the plugin does not exist; components reach them through `useNativeApp().isNativeApp`. Universal links are served by one Nitro handler whose path list is the same list that decides which pages the app contains.

**Tech Stack:** Nuxt 4, Nitro/h3, Vitest, Playwright, Capacitor 8, `@ebarooni/capacitor-calendar`, `@capacitor/haptics`, `@capacitor/share`, `@capacitor/app`, `@nuxt/icon`.

**Spec:** `docs/superpowers/specs/2026-10-06-ios-app-design.md` (section 4 and milestone 3 of section 7). Milestones 1 and 2 are merged and live.

## Global Constraints

- The website's behaviour must not change. In particular the calendar links in emails and on the website must stay byte-for-byte what they are today.
- No database change in this milestone. Merging deploys to production automatically, so nothing here may depend on a manual step being done first.
- Lesson times are stored as "floating" UTC: `09:45Z` means 09:45 on the clock in the Netherlands. A calendar event must land on that Dutch wall-clock time whatever time zone the phone is in, summer and winter.
- A lesson lasts one hour.
- Bundle ID `com.ravennah.app`, Apple team `6DK95S2F4D`, universal-link domain `www.ravennah.com` (the apex `ravennah.com` does not answer).
- Universal links cover exactly the member paths: `/login`, `/lessen`, `/account`, `/archief`, `/admin`, `/verify-email`, `/reset-wachtwoord` and everything below them. Marketing pages keep opening in Safari.
- Dutch UI text, verbatim: `Zet in agenda`, `Zet de les in je agenda`, `Deel deze les`.
- The shared link in a shared lesson is `https://www.ravennah.com/eerste-les`.
- The app requires iOS 17 or later (owner decision): the calendar feature relies on the system event sheet working without calendar permission.
- A Capacitor plugin object is a Proxy: never return it from an `async` function or resolve a promise with it. Import the plugin inside the function that uses it and call it there.
- Every native util must be safe where its plugin does not exist (a desktop browser): no thrown error may reach a booking, cancellation or page load.
- DRY: no copied code. Tests are written before the code they cover. Run `yarn test:unit` before deleting or moving existing code.
- Work on a new branch `feature/ios-m3-native` created from `origin/master`.

## Review Focus

1. A lesson at 09:45 must appear at 09:45 Dutch time in the calendar in July and in January, and for a phone set to another time zone — tests in Task 1.
2. The calendar links in booking emails and on the website must not change by a single character — characterization tests in Task 1.
3. A universal link to a non-member path, to another host, or a malformed URL must not navigate the app anywhere — tests in Task 5.
4. Calendar, haptics and share being unavailable must never break a booking or cancellation — util tests in Tasks 2–4 and the app-mode e2e run.
5. The app must not fetch icons from a third-party server at runtime — e2e guard in Task 6.

## File Structure

| File | Responsibility |
|---|---|
| `shared/lesson.ts` (new) | Lesson address, type label, calendar title, calendar link, real start instant |
| `app/utils/nativeCalendar.ts` (new) | Adds a lesson to the phone's calendar |
| `app/utils/nativeHaptics.ts` (new) | One haptic tap per outcome |
| `app/utils/shareLesson.ts` (new) | Share content and the share sheet |
| `app/utils/nativeLinks.ts` (new) | Turns an incoming universal link into an in-app path |
| `app/plugins/native-links.client.ts` (new) | Listens for incoming links |
| `server/handlers/appleAppSiteAssociation.ts` (new) | Tells iOS which paths belong to the app |
| `config/ios-target.ts` | The one list of member paths |
| `scripts/generate-icons.ts` | Draws the app icons; the dark design becomes the default |

---

### Task 1: One place for lesson details

**Files:**
- Create: `shared/lesson.ts`, `shared/lesson.test.ts`
- Modify: `app/plugins/rav.ts`, `server/utils/bookingNotifications.ts`, `server/api/sendLessonReminders.post.ts`

**Interfaces:**
- Produces: `type LessonKind = { type?: string | null; teacher?: string | null }`, `LESSON_DURATION_MS`, `lessonAddress(lesson: LessonKind): string`, `lessonTypeLabel(lesson: LessonKind): string`, `lessonCalendarTitle(lesson: LessonKind): string`, `calendarLink(service: string, lesson: LessonKind, start: Date): string`, `lessonStartInstant(date: Date | string): Date`.

- [ ] **Step 1: Write the failing tests**

Create `shared/lesson.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { calendarLink, lessonAddress, lessonCalendarTitle, lessonStartInstant, lessonTypeLabel, LESSON_DURATION_MS } from './lesson'

const hatha = { type: 'hatha yoga', teacher: null }
const peachy = { type: 'peachy bum', teacher: null }
const guest = { type: 'guest lesson', teacher: 'Bo Bol' }

describe('lessonAddress', () => {
  it('is the studio for everything except Peachy Bum', () => {
    expect(lessonAddress(hatha)).toBe('Emmy van Leersumhof 24a, 3059 LT Rotterdam')
    expect(lessonAddress(guest)).toBe('Emmy van Leersumhof 24a, 3059 LT Rotterdam')
    expect(lessonAddress({})).toBe('Emmy van Leersumhof 24a, 3059 LT Rotterdam')
    expect(lessonAddress(peachy)).toBe('Kosboulevard 5, 3059 XZ Rotterdam')
  })
})

describe('lessonTypeLabel', () => {
  it('names the lesson the way emails and notifications do', () => {
    expect(lessonTypeLabel(hatha)).toBe('Hatha Yoga')
    expect(lessonTypeLabel(peachy)).toBe('Peachy Bum')
    expect(lessonTypeLabel(guest)).toBe('Yin-Yang Yoga door gastdocent Bo Bol')
    expect(lessonTypeLabel({})).toBe('Hatha Yoga')
  })
})

describe('lessonCalendarTitle', () => {
  it('is the title of the calendar entry', () => {
    expect(lessonCalendarTitle(hatha)).toBe('Hatha Yoga les Ravennah')
    expect(lessonCalendarTitle(guest)).toBe('Hatha Yoga les Ravennah')
    expect(lessonCalendarTitle(peachy)).toBe('Peachy Bum les Ravennah')
  })
})

describe('calendarLink', () => {
  const start = new Date('2026-10-11T09:45:00.000Z')

  // These exact strings are what the website and the booking emails produce today
  it('builds the same link as before for a regular lesson', () => {
    expect(calendarLink('apple', hatha, start)).toBe(
      'https://calndr.link/d/event/?service=apple&start=2026-10-11%209:45&title=Hatha Yoga les%20Ravennah&timezone=Europe/Amsterdam&location=Emmy%20van%20Leersumhof%2024a%2C%203059%20LT%20Rotterdam',
    )
  })

  it('builds the same link as before for Peachy Bum', () => {
    expect(calendarLink('gmail', peachy, start)).toBe(
      'https://calndr.link/d/event/?service=gmail&start=2026-10-11%209:45&title=Peachy Bum les%20Ravennah&timezone=Europe/Amsterdam&location=Kosboulevard%205%2C%203059%20XZ%20Rotterdam',
    )
  })

  it('does not pad the hour and does pad the minutes', () => {
    expect(calendarLink('outlook', hatha, new Date('2026-10-11T19:05:00.000Z'))).toContain('start=2026-10-11%2019:05&')
    expect(calendarLink('outlook', hatha, new Date('2026-10-11T08:00:00.000Z'))).toContain('start=2026-10-11%208:00&')
  })
})

describe('lessonStartInstant', () => {
  it('turns the stored clock time into the real moment in the Netherlands in summer (UTC+2)', () => {
    expect(lessonStartInstant('2026-07-05T09:45:00.000Z').toISOString()).toBe('2026-07-05T07:45:00.000Z')
  })

  it('does the same in winter (UTC+1)', () => {
    expect(lessonStartInstant(new Date('2026-01-04T09:45:00.000Z')).toISOString()).toBe('2026-01-04T08:45:00.000Z')
  })

  it('does not depend on the time zone of the device running it', () => {
    const previous = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      expect(lessonStartInstant('2026-07-05T09:45:00.000Z').toISOString()).toBe('2026-07-05T07:45:00.000Z')
    } finally {
      process.env.TZ = previous
    }
  })
})

describe('LESSON_DURATION_MS', () => {
  it('is one hour', () => {
    expect(LESSON_DURATION_MS).toBe(3_600_000)
  })
})
```

Run: `yarn vitest run shared/lesson.test.ts`
Expected: FAIL — cannot resolve `./lesson`.

- [ ] **Step 2: Implement**

Create `shared/lesson.ts`:

```ts
/**
 * Lesson details shared by the server (emails, notifications) and the client (website, iOS app).
 */

export type LessonKind = { type?: string | null; teacher?: string | null }

export const LESSON_DURATION_MS = 60 * 60 * 1000

const STUDIO_ADDRESS = 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
const PEACHY_BUM_ADDRESS = 'Kosboulevard 5, 3059 XZ Rotterdam'

const isPeachyBum = (lesson: LessonKind) => lesson.type === 'peachy bum'

export function lessonAddress(lesson: LessonKind): string {
  return isPeachyBum(lesson) ? PEACHY_BUM_ADDRESS : STUDIO_ADDRESS
}

/** The lesson's name as used in emails and notifications. */
export function lessonTypeLabel(lesson: LessonKind): string {
  if (lesson.type === 'guest lesson') return `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
  return isPeachyBum(lesson) ? 'Peachy Bum' : 'Hatha Yoga'
}

const calendarTitleBase = (lesson: LessonKind) => (isPeachyBum(lesson) ? 'Peachy Bum les' : 'Hatha Yoga les')

/** The title of the lesson's calendar entry. */
export function lessonCalendarTitle(lesson: LessonKind): string {
  return `${calendarTitleBase(lesson)} Ravennah`
}

/**
 * A calndr.link "add to calendar" URL. `start` is the stored lesson date: its UTC clock time
 * is the Dutch wall-clock time, which is why the link names the time zone separately.
 */
export function calendarLink(service: string, lesson: LessonKind, start: Date): string {
  const day = start.toISOString().slice(0, 10)
  const time = `${start.getUTCHours()}:${start.getUTCMinutes().toString().padStart(2, '0')}`
  return `https://calndr.link/d/event/?service=${service}&start=${day}%20${time}&title=${calendarTitleBase(lesson)}%20Ravennah&timezone=Europe/Amsterdam&location=${encodeURIComponent(lessonAddress(lesson))}`
}

const amsterdamClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Amsterdam',
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})

/** How far the Dutch clock is ahead of UTC at the given moment, in milliseconds. */
function amsterdamOffsetMs(moment: Date): number {
  const parts = Object.fromEntries(amsterdamClock.formatToParts(moment).map((part) => [part.type, Number(part.value)]))
  const clockAsUtc = Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!)
  return clockAsUtc - Math.floor(moment.getTime() / 1000) * 1000
}

/**
 * Lesson dates are stored with the Dutch wall-clock time written as UTC ("09:45Z" means 09:45 in the Netherlands).
 * This returns the real moment the lesson starts, for anything that needs an absolute time (a calendar event).
 */
export function lessonStartInstant(date: Date | string): Date {
  const clockTime = new Date(date).getTime()
  return new Date(clockTime - amsterdamOffsetMs(new Date(clockTime)))
}
```

Run: `yarn vitest run shared/lesson.test.ts`
Expected: 10 passed.

- [ ] **Step 3: Point the three existing copies at it**

Run `yarn test:unit` first (expected: all pass), because existing code is about to be replaced.

In `app/plugins/rav.ts`:

1. Add at the top of the file, with the other imports (or as the first line if there are none):

```ts
import { calendarLink } from '~~/shared/lesson'
```

2. Replace the whole `getCalenderLink` method

```ts
        getCalenderLink(stream: string, date: string, type: string = 'hatha yoga') {
            const lessonType = type == 'peachy bum' ? 'Peachy Bum les' : 'Hatha Yoga les'
            const address = type == 'peachy bum' ? 'Kosboulevard 5, 3059 XZ Rotterdam' : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
            const lessonDate = dayjs(new Date(date)).utc()
            const startTime = lessonDate.format('H')
            const startMinutes = lessonDate.format('mm')
            return `https://calndr.link/d/event/?service=${stream}&start=${lessonDate.format('YYYY-MM-DD')}%20${startTime}:${startMinutes}&title=${lessonType}%20Ravennah&timezone=Europe/Amsterdam&location=${encodeURIComponent(address)}`
        },
```

with

```ts
        getCalenderLink(stream: string, date: string, type: string = 'hatha yoga') {
            return calendarLink(stream, { type }, new Date(date))
        },
```

In `server/utils/bookingNotifications.ts`:

1. Add to the imports:

```ts
import { calendarLink, lessonTypeLabel } from '../../shared/lesson'
```

2. Replace the two functions `lessonTitle` and `calendarLinks` (from `function lessonTitle(` through the closing `}` of `calendarLinks`) with:

```ts
function calendarLinks(lesson: { type: string | null }, lessonDate: Date) {
    return {
        apple: calendarLink('apple', lesson, lessonDate),
        google: calendarLink('gmail', lesson, lessonDate),
        outlook: calendarLink('outlook', lesson, lessonDate),
    }
}
```

3. Replace `const lessonType = lessonTitle(lesson)` with `const lessonType = lessonTypeLabel(lesson)`.

In `server/api/sendLessonReminders.post.ts`:

1. Add to the imports:

```ts
import { lessonAddress, lessonTypeLabel } from '../../shared/lesson'
```

2. Replace

```ts
        const lessonType = lesson.type === 'guest lesson'
            ? `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
            : lesson.type === 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'
        const formattedDate = formatLessonDate(lessonDate)
        const address = lesson.type === 'peachy bum'
            ? 'Kosboulevard 5, 3059 XZ Rotterdam'
            : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
```

with

```ts
        const lessonType = lessonTypeLabel(lesson)
        const formattedDate = formatLessonDate(lessonDate)
        const address = lessonAddress(lesson)
```

Do not delete `formatISODate`, `formatHour` or `formatMinutes` from `server/utils/dates.ts`, even if nothing uses them any more; say in your report whether they are still referenced.

- [ ] **Step 4: Verify nothing changed for the website**

Run: `yarn test:unit` — expected: all pass (the booking-notification tests still see the same email data).
Run: `yarn test:e2e:branch` — expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add shared/lesson.ts shared/lesson.test.ts app/plugins/rav.ts server/utils/bookingNotifications.ts server/api/sendLessonReminders.post.ts
git commit -m "Share lesson address, title and calendar link between server and client"
```

---

### Task 2: Add a lesson to the phone's calendar

**Files:**
- Create: `app/utils/nativeCalendar.ts`, `app/utils/nativeCalendar.test.ts`
- Modify: `app/components/AccountBookings.vue`, `app/composables/useBookingActions.ts`, `e2e/app-mode.spec.ts`, `package.json` (dependency)

**Interfaces:**
- Consumes: `lessonAddress`, `lessonCalendarTitle`, `lessonStartInstant`, `LESSON_DURATION_MS`, `LessonKind` from `~~/shared/lesson` (Task 1).
- Produces: `lessonCalendarEvent(lesson: LessonKind & { date: string }): { title: string; location: string; startDate: number; endDate: number }`, `addLessonToCalendar(lesson: LessonKind & { date: string }): Promise<boolean>`.

- [ ] **Step 1: Install the plugin and check its API**

```bash
yarn add @ebarooni/capacitor-calendar
```

Open `node_modules/@ebarooni/capacitor-calendar/README.md` (and its type definitions) and confirm:
- the plugin export is `CapacitorCalendar`;
- there is a method that opens the system's event sheet prefilled, named `createEventWithPrompt`, taking `title`, `location`, `startDate` and `endDate`, with dates as millisecond timestamps;
- what the README says about permissions and `Info.plist` keys for that method on iOS 17 and later.

Write what you found into your report. If the method name, an option name or the date format differs, reply BLOCKED quoting the README. If the README says the prompt method needs full calendar access, reply BLOCKED: the design promises no calendar permission prompt.

- [ ] **Step 2: Write the failing tests**

Create `app/utils/nativeCalendar.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const calendar = vi.hoisted(() => ({ createEventWithPrompt: vi.fn() }))

vi.mock('@ebarooni/capacitor-calendar', () => ({
  // Like a real Capacitor plugin: a Proxy that refuses to be treated as a promise
  CapacitorCalendar: new Proxy(calendar, {
    get(target, key) {
      if (key === 'then') throw new Error('CapacitorCalendar.then() is not implemented')
      return (target as any)[key]
    },
  }),
}))

import { addLessonToCalendar, lessonCalendarEvent } from './nativeCalendar'

const lesson = { type: 'hatha yoga', teacher: null, date: '2026-07-05T09:45:00.000Z' }

beforeEach(() => {
  calendar.createEventWithPrompt.mockReset().mockResolvedValue({ id: 'event-1' })
})

describe('lessonCalendarEvent', () => {
  it('describes the lesson at its Dutch clock time, lasting an hour', () => {
    expect(lessonCalendarEvent(lesson)).toEqual({
      title: 'Hatha Yoga les Ravennah',
      location: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam',
      startDate: Date.parse('2026-07-05T07:45:00.000Z'),
      endDate: Date.parse('2026-07-05T08:45:00.000Z'),
    })
  })
})

describe('addLessonToCalendar', () => {
  it('opens the calendar sheet with the lesson filled in', async () => {
    await expect(addLessonToCalendar(lesson)).resolves.toBe(true)
    expect(calendar.createEventWithPrompt).toHaveBeenCalledWith(lessonCalendarEvent(lesson))
  })

  it('reports failure instead of throwing where the calendar does not exist', async () => {
    calendar.createEventWithPrompt.mockRejectedValue(new Error('Not implemented on web.'))
    await expect(addLessonToCalendar(lesson)).resolves.toBe(false)
  })
})
```

Run: `yarn vitest run app/utils/nativeCalendar.test.ts`
Expected: FAIL — cannot resolve `./nativeCalendar`.

- [ ] **Step 3: Implement**

Create `app/utils/nativeCalendar.ts`:

```ts
import { LESSON_DURATION_MS, lessonAddress, lessonCalendarTitle, lessonStartInstant, type LessonKind } from '~~/shared/lesson'

type DatedLesson = LessonKind & { date: string }

export function lessonCalendarEvent(lesson: DatedLesson) {
  const startDate = lessonStartInstant(lesson.date).getTime()
  return {
    title: lessonCalendarTitle(lesson),
    location: lessonAddress(lesson),
    startDate,
    endDate: startDate + LESSON_DURATION_MS,
  }
}

/**
 * iOS app: opens the system's "new event" sheet with the lesson filled in; the user taps Add.
 * The system sheet writes the event itself, so the app needs no calendar permission.
 */
export async function addLessonToCalendar(lesson: DatedLesson): Promise<boolean> {
  try {
    // Imported here, never returned: a Capacitor plugin proxy must not become a promise result
    const { CapacitorCalendar } = await import('@ebarooni/capacitor-calendar')
    await CapacitorCalendar.createEventWithPrompt(lessonCalendarEvent(lesson))
    return true
  } catch (err) {
    console.error('[Calendar] Adding the lesson failed:', err)
    return false
  }
}
```

Run: `yarn vitest run app/utils/nativeCalendar.test.ts`
Expected: 3 passed.

- [ ] **Step 4: One button in the app instead of three calendar icons**

In `app/components/AccountBookings.vue`:

1. In `<script setup>`, add (next to the other composable calls):

```ts
const { isNativeApp } = useNativeApp()
```

(If the component already has `isNativeApp`, do not declare it twice.)

2. In the template, in the block headed `Zet in je agenda`, replace

```html
              <div class="flex gap-3 mt-2">
                <UTooltip text="Apple Agenda">
```

with

```html
              <UButton v-if="isNativeApp" class="mt-2" color="primary" variant="soft" icon="i-lucide-calendar-plus" @click="addLessonToCalendar(bookingGroup.lessons)">Zet in agenda</UButton>
              <div v-else class="flex gap-3 mt-2">
                <UTooltip text="Apple Agenda">
```

The three existing links stay exactly as they are inside that `v-else` div.

- [ ] **Step 5: Offer it right after a booking**

In `app/composables/useBookingActions.ts`:

1. Directly after the line `const { isNativeApp } = useNativeApp()` add:

```ts
  const toast = useToast()
```

2. Replace

```ts
        // The moment a reminder becomes useful: offer notifications, once
        if (isNativeApp) void offerPushAfterBooking()
```

with

```ts
        if (isNativeApp) {
          // The moment a reminder becomes useful: offer notifications, once
          void offerPushAfterBooking()
          toast.add({
            id: 'calendar-offer',
            title: 'Zet de les in je agenda',
            icon: 'i-lucide-calendar-plus',
            color: 'primary',
            actions: [{ label: 'Zet in agenda', onClick: () => { void addLessonToCalendar(lesson) } }],
          })
        }
```

- [ ] **Step 6: Cover it in the app smoke test**

In `e2e/app-mode.spec.ts`, directly after the line `await bookFirstAvailableLesson(page)` add:

```ts
    // After a booking the app offers to put the lesson in the calendar
    await expect(page.getByText('Zet de les in je agenda')).toBeVisible({ timeout: 10_000 })
```

Run: `yarn test:e2e:branch --app > /tmp/app-m3-2.log 2>&1; echo $?; grep -E "passed|failed" /tmp/app-m3-2.log`
Expected: exit 0, `1 passed`.

Run: `yarn test:unit` — expected: all pass.
Run: `yarn test:e2e:branch` — expected: 6 passed (the website still shows its three calendar links; no toast there).

- [ ] **Step 7: Commit**

```bash
git add app/utils/nativeCalendar.ts app/utils/nativeCalendar.test.ts app/components/AccountBookings.vue app/composables/useBookingActions.ts e2e/app-mode.spec.ts package.json yarn.lock
git commit -m "Add booked lessons to the phone's calendar from the iOS app"
```

---

### Task 3: Haptic feedback on booking actions

**Files:**
- Create: `app/utils/nativeHaptics.ts`, `app/utils/nativeHaptics.test.ts`
- Modify: `app/composables/useBookingActions.ts`, `package.json` (dependency)

**Interfaces:**
- Produces: `type HapticKind = 'success' | 'warning' | 'error'`, `haptic(kind: HapticKind): Promise<void>` (never rejects).

- [ ] **Step 1: Install the plugin and check its API**

```bash
yarn add @capacitor/haptics
```

Confirm in `node_modules/@capacitor/haptics/README.md`: `Haptics.notification({ type })` with `NotificationType.Success`, `NotificationType.Warning`, `NotificationType.Error`. If it differs, reply BLOCKED quoting the README.

- [ ] **Step 2: Write the failing tests**

Create `app/utils/nativeHaptics.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const haptics = vi.hoisted(() => ({ notification: vi.fn() }))

vi.mock('@capacitor/haptics', () => ({
  Haptics: new Proxy(haptics, {
    get(target, key) {
      if (key === 'then') throw new Error('Haptics.then() is not implemented')
      return (target as any)[key]
    },
  }),
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}))

import { haptic } from './nativeHaptics'

beforeEach(() => {
  haptics.notification.mockReset().mockResolvedValue(undefined)
})

describe('haptic', () => {
  it.each([
    ['success', 'SUCCESS'],
    ['warning', 'WARNING'],
    ['error', 'ERROR'],
  ] as const)('plays the %s pattern', async (kind, type) => {
    await haptic(kind)
    expect(haptics.notification).toHaveBeenCalledWith({ type })
  })

  it('never throws, also where the device cannot vibrate', async () => {
    haptics.notification.mockRejectedValue(new Error('Not available'))
    await expect(haptic('success')).resolves.toBeUndefined()
  })
})
```

Run: `yarn vitest run app/utils/nativeHaptics.test.ts`
Expected: FAIL — cannot resolve `./nativeHaptics`.

- [ ] **Step 3: Implement**

Create `app/utils/nativeHaptics.ts`:

```ts
export type HapticKind = 'success' | 'warning' | 'error'

/** iOS app: a short tap the user feels when something worked, was undone, or failed. Never throws. */
export async function haptic(kind: HapticKind): Promise<void> {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    const types = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error }
    await Haptics.notification({ type: types[kind] })
  } catch {
    // No haptics on this device: nothing to do
  }
}
```

Run: `yarn vitest run app/utils/nativeHaptics.test.ts`
Expected: 4 passed.

- [ ] **Step 4: Wire it into the two booking actions**

In `app/composables/useBookingActions.ts`, `handleBooking` and `cancelBooking` each consist of one `await call(async () => { ... })` statement. `call` records a failure in `error` instead of throwing.

1. In `handleBooking`, directly after the closing `})` of its `await call(...)` statement (still inside the function) add:

```ts
    if (isNativeApp) void haptic(error.value ? 'error' : 'success')
```

2. In `cancelBooking`, directly after the closing `})` of its `await call(...)` statement add:

```ts
    if (isNativeApp) void haptic(error.value ? 'error' : 'warning')
```

- [ ] **Step 5: Verify and commit**

Run: `yarn test:unit` — expected: all pass.
Run: `yarn test:e2e:branch --app > /tmp/app-m3-3.log 2>&1; echo $?; grep -E "passed|failed" /tmp/app-m3-3.log` — expected: exit 0, `1 passed` (booking still works in a browser, where there are no haptics).

```bash
git add app/utils/nativeHaptics.ts app/utils/nativeHaptics.test.ts app/composables/useBookingActions.ts package.json yarn.lock
git commit -m "Give haptic feedback on booking and cancelling in the iOS app"
```

---

### Task 4: Share a lesson

**Files:**
- Create: `app/utils/shareLesson.ts`, `app/utils/shareLesson.test.ts`
- Modify: `app/pages/lessen.vue`, `e2e/app-mode.spec.ts`, `package.json` (dependency)

**Interfaces:**
- Produces: `TRIAL_LESSON_URL`, `lessonShareContent(title: string, when: string): { title: string; text: string; url: string }`, `canShareLesson(isNativeApp: boolean): boolean`, `shareLesson(isNativeApp: boolean, title: string, when: string): Promise<void>` (never rejects).

- [ ] **Step 1: Install the plugin and check its API**

```bash
yarn add @capacitor/share
```

Confirm in `node_modules/@capacitor/share/README.md`: `Share.share({ title, text, url })`. If it differs, reply BLOCKED quoting the README.

- [ ] **Step 2: Write the failing tests**

Create `app/utils/shareLesson.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const plugin = vi.hoisted(() => ({ share: vi.fn() }))

vi.mock('@capacitor/share', () => ({
  Share: new Proxy(plugin, {
    get(target, key) {
      if (key === 'then') throw new Error('Share.then() is not implemented')
      return (target as any)[key]
    },
  }),
}))

import { canShareLesson, lessonShareContent, shareLesson } from './shareLesson'

const expected = {
  title: 'Yoga Ravennah',
  text: 'Ga je mee naar Hatha Yoga met Ravennah op zondag 11 oktober van 9.45 tot 10.45 uur?',
  url: 'https://www.ravennah.com/eerste-les',
}

beforeEach(() => {
  plugin.share.mockReset().mockResolvedValue({})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lessonShareContent', () => {
  it('invites someone to the lesson and links to the trial-lesson page', () => {
    expect(lessonShareContent('Hatha Yoga met Ravennah', 'zondag 11 oktober van 9.45 tot 10.45 uur')).toEqual(expected)
  })
})

describe('canShareLesson', () => {
  it('is always possible in the app', () => {
    expect(canShareLesson(true)).toBe(true)
  })

  it('depends on the browser on the website', () => {
    vi.stubGlobal('navigator', {})
    expect(canShareLesson(false)).toBe(false)
    vi.stubGlobal('navigator', { share: vi.fn() })
    expect(canShareLesson(false)).toBe(true)
  })
})

describe('shareLesson', () => {
  it('opens the iOS share sheet in the app', async () => {
    await shareLesson(true, 'Hatha Yoga met Ravennah', 'zondag 11 oktober van 9.45 tot 10.45 uur')
    expect(plugin.share).toHaveBeenCalledWith(expected)
  })

  it("uses the browser's own sharing on the website", async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })

    await shareLesson(false, 'Hatha Yoga met Ravennah', 'zondag 11 oktober van 9.45 tot 10.45 uur')

    expect(share).toHaveBeenCalledWith(expected)
    expect(plugin.share).not.toHaveBeenCalled()
  })

  it('does not throw when the user closes the share sheet', async () => {
    plugin.share.mockRejectedValue(new Error('Share canceled'))
    await expect(shareLesson(true, 'x', 'y')).resolves.toBeUndefined()
  })
})
```

Run: `yarn vitest run app/utils/shareLesson.test.ts`
Expected: FAIL — cannot resolve `./shareLesson`.

- [ ] **Step 3: Implement**

Create `app/utils/shareLesson.ts`:

```ts
/** Someone who receives a shared lesson probably has no account yet, so the link goes to the trial-lesson page. */
export const TRIAL_LESSON_URL = 'https://www.ravennah.com/eerste-les'

export function lessonShareContent(title: string, when: string) {
  return {
    title: 'Yoga Ravennah',
    text: `Ga je mee naar ${title} op ${when}?`,
    url: TRIAL_LESSON_URL,
  }
}

/** The app can always share; a browser only if it has a share feature of its own. */
export function canShareLesson(isNativeApp: boolean): boolean {
  return isNativeApp || (typeof navigator !== 'undefined' && typeof navigator.share === 'function')
}

/** Opens the share sheet for a lesson. Never throws: closing the sheet is not an error. */
export async function shareLesson(isNativeApp: boolean, title: string, when: string): Promise<void> {
  const content = lessonShareContent(title, when)
  try {
    if (isNativeApp) {
      const { Share } = await import('@capacitor/share')
      await Share.share(content)
    } else {
      await navigator.share(content)
    }
  } catch {
    // The user closed the sheet, or sharing is not available
  }
}
```

Run: `yarn vitest run app/utils/shareLesson.test.ts`
Expected: 6 passed.

- [ ] **Step 4: Add the button to each lesson**

In `app/pages/lessen.vue`:

1. In `<script setup>`, directly after the line `const { $rav } = useNuxtApp()` add:

```ts
const { isNativeApp } = useNativeApp()
// Decided after mount: it depends on the browser, which the server-rendered page cannot know
const canShare = ref(false)
onMounted(() => { canShare.value = canShareLesson(isNativeApp) })
```

2. In the template, inside the `<!-- Action row -->` div, directly after the last branch

```html
              <UButton v-else-if="!loggedInUser" block color="primary" variant="solid" to="/login">
                Login om te boeken
              </UButton>
```

add

```html
              <UButton v-if="canShare" block class="mt-2" color="neutral" variant="ghost" size="sm" icon="i-lucide-share-2"
                @click="shareLesson(isNativeApp, $rav.getLessonTitle(lesson), $rav.formatDateInDutch(lesson.date, true))">
                Deel deze les
              </UButton>
```

- [ ] **Step 5: Cover it in the app smoke test**

In `e2e/app-mode.spec.ts`, directly after the line `await page.goto('/lessen')` add:

```ts
    // Every lesson can be shared from the app
    await expect(page.getByRole('button', { name: 'Deel deze les' }).first()).toBeVisible({ timeout: 10_000 })
```

Run: `yarn test:e2e:branch --app > /tmp/app-m3-4.log 2>&1; echo $?; grep -E "passed|failed" /tmp/app-m3-4.log` — expected: exit 0, `1 passed`.
Run: `yarn test:unit` — expected: all pass.
Run: `yarn test:e2e:branch` — expected: 6 passed.

- [ ] **Step 6: Commit**

```bash
git add app/utils/shareLesson.ts app/utils/shareLesson.test.ts app/pages/lessen.vue e2e/app-mode.spec.ts package.json yarn.lock
git commit -m "Share a lesson from the lesson list"
```

---

### Task 5: Universal links

**Files:**
- Create: `server/handlers/appleAppSiteAssociation.ts`, `server/handlers/appleAppSiteAssociation.test.ts`, `app/utils/nativeLinks.ts`, `app/utils/nativeLinks.test.ts`, `app/plugins/native-links.client.ts`, `e2e/universal-links.spec.ts`
- Modify: `config/ios-target.ts`, `config/ios-target.test.ts`, `nuxt.config.ts`, `vitest.config.ts` (only if `server/handlers` is not already covered by `server/**`), `ios/App/App/App.entitlements`, `package.json` (dependency)

**Interfaces:**
- Produces: `MEMBER_ROUTE_PREFIXES` (exported), `isMemberPath(path: string): boolean` from `config/ios-target.ts`; `appleAppSiteAssociation()`; `appPathFromLink(url: string, siteOrigin: string): string | null`; `onAppLink(handler: (url: string) => void): Promise<void>`.

- [ ] **Step 1: One exported list of member paths**

In `config/ios-target.test.ts` add:

```ts
import { isMemberPath } from './ios-target'

describe('isMemberPath', () => {
  it('accepts member paths and everything below them', () => {
    for (const path of ['/login', '/lessen', '/account', '/archief', '/admin/users/abc', '/verify-email', '/reset-wachtwoord']) {
      expect(isMemberPath(path), path).toBe(true)
    }
  })

  it('rejects marketing paths, the root and look-alikes', () => {
    for (const path of ['/', '/tarieven', '/eerste-les', '/lessen-info', '/accounts', '']) {
      expect(isMemberPath(path), path).toBe(false)
    }
  })
})
```

(Merge the import with the file's existing import from `./ios-target`.)

Run: `yarn vitest run config/ios-target.test.ts` — expected: FAIL (`isMemberPath` is not exported).

In `config/ios-target.ts` replace

```ts
/** Route prefixes of the member area — the only pages bundled into the iOS app. */
const MEMBER_ROUTE_PREFIXES = ['/login', '/lessen', '/account', '/archief', '/admin', '/verify-email', '/reset-wachtwoord']
```

with

```ts
/** Route prefixes of the member area: the pages bundled into the iOS app, and the links that open it. */
export const MEMBER_ROUTE_PREFIXES = ['/login', '/lessen', '/account', '/archief', '/admin', '/verify-email', '/reset-wachtwoord']

export function isMemberPath(path: string): boolean {
  return MEMBER_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}
```

and replace the body of `isMemberPage` so it reads:

```ts
function isMemberPage(page: NuxtPage): boolean {
  return isMemberPath(page.path)
}
```

Run: `yarn vitest run config/ios-target.test.ts` — expected: all pass.

- [ ] **Step 2: The association file — failing test**

Create `server/handlers/appleAppSiteAssociation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { appleAppSiteAssociation } from './appleAppSiteAssociation'

describe('apple-app-site-association', () => {
  const { details } = appleAppSiteAssociation().applinks

  it('names the app by team id and bundle id', () => {
    expect(details).toHaveLength(1)
    expect(details[0]!.appIDs).toEqual(['6DK95S2F4D.com.ravennah.app'])
  })

  it('claims every member path and what lies below it', () => {
    const paths = details[0]!.components.map((component) => component['/'])
    expect(paths).toEqual(expect.arrayContaining([
      '/login', '/lessen', '/account', '/archief', '/admin', '/admin/*', '/verify-email', '/reset-wachtwoord',
    ]))
  })

  it('claims no marketing path', () => {
    const paths = details[0]!.components.map((component) => component['/'])
    expect(paths).not.toContain('/')
    expect(paths).not.toContain('/*')
    expect(paths.some((path) => path.startsWith('/tarieven') || path.startsWith('/eerste-les'))).toBe(false)
  })
})
```

Run: `yarn vitest run server/handlers` — expected: FAIL — cannot resolve `./appleAppSiteAssociation`. (The `server/**/*.test.ts` pattern in `vitest.config.ts` already covers this folder; if Vitest finds no test file at all, check that include list and report what you found before changing it.)

- [ ] **Step 3: The association file — implementation**

Create `server/handlers/appleAppSiteAssociation.ts`:

```ts
import { MEMBER_ROUTE_PREFIXES } from '../../config/ios-target'

// Apple team id + bundle id of the iOS app
const APP_ID = '6DK95S2F4D.com.ravennah.app'

/** Tells iOS which links on this site open in the app instead of Safari: the member area, nothing else. */
export function appleAppSiteAssociation() {
  return {
    applinks: {
      details: [{
        appIDs: [APP_ID],
        components: MEMBER_ROUTE_PREFIXES.flatMap((prefix) => [{ '/': prefix }, { '/': `${prefix}/*` }]),
      }],
    },
  }
}

export default defineEventHandler(() => appleAppSiteAssociation())
```

Run: `yarn vitest run server/handlers` — expected: 3 passed.

In `nuxt.config.ts`, in the `nitro` block, directly after the line `...(iosTarget ? { output: { dir: '.output-ios' } } : {}),` add:

```ts
    // iOS reads this file (served as JSON, no extension) to learn which links open the app
    handlers: [
      { route: '/.well-known/apple-app-site-association', handler: fileURLToPath(new URL('./server/handlers/appleAppSiteAssociation.ts', import.meta.url)) },
    ],
```

Create `e2e/universal-links.spec.ts`:

```ts
/**
 * E2E test: the file iOS fetches to learn which links open the app.
 */

import { test, expect } from '@playwright/test'

test('the site serves the apple-app-site-association file as JSON', async ({ request }) => {
    const response = await request.get('/.well-known/apple-app-site-association')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')
    const body = await response.json()
    expect(body.applinks.details[0].appIDs).toEqual(['6DK95S2F4D.com.ravennah.app'])
})
```

Run: `yarn test:e2e:branch e2e/universal-links.spec.ts` — expected: 1 passed. If the route is not found (404), the handler registration did not take: find out why (Nitro's handler path resolution) and fix it within this intent; do not move the file under `public/`, where it would be served without a JSON content type.

- [ ] **Step 4: Turning a link into an in-app path — failing tests**

```bash
yarn add @capacitor/app
```

Confirm in `node_modules/@capacitor/app/README.md`: `App.addListener('appUrlOpen', (event: { url: string }) => ...)`. If it differs, reply BLOCKED quoting the README.

Create `app/utils/nativeLinks.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const plugin = vi.hoisted(() => ({
  listeners: new Map<string, (event: any) => void>(),
  addListener: vi.fn(),
}))

vi.mock('@capacitor/app', () => ({
  App: new Proxy(plugin, {
    get(target, key) {
      if (key === 'then') throw new Error('App.then() is not implemented')
      return (target as any)[key]
    },
  }),
}))

import { appPathFromLink, onAppLink } from './nativeLinks'

const SITE = 'https://www.ravennah.com'

beforeEach(() => {
  plugin.listeners.clear()
  plugin.addListener.mockReset().mockImplementation(async (name: string, handler: (event: any) => void) => {
    plugin.listeners.set(name, handler)
    return { remove: async () => {} }
  })
})

describe('appPathFromLink', () => {
  it('keeps the path and the query of a member link', () => {
    expect(appPathFromLink(`${SITE}/reset-wachtwoord?token=abc`, SITE)).toBe('/reset-wachtwoord?token=abc')
    expect(appPathFromLink(`${SITE}/account?tab=lessen`, SITE)).toBe('/account?tab=lessen')
    expect(appPathFromLink(`${SITE}/admin/users/student_1`, SITE)).toBe('/admin/users/student_1')
  })

  it('ignores links to pages the app does not contain', () => {
    expect(appPathFromLink(`${SITE}/tarieven`, SITE)).toBeNull()
    expect(appPathFromLink(`${SITE}/`, SITE)).toBeNull()
    expect(appPathFromLink(`${SITE}/lessen-info`, SITE)).toBeNull()
  })

  it('ignores other sites, other schemes and nonsense', () => {
    expect(appPathFromLink('https://evil.example/account', SITE)).toBeNull()
    expect(appPathFromLink('https://www.ravennah.com.evil.example/account', SITE)).toBeNull()
    expect(appPathFromLink('capacitor://localhost/account', SITE)).toBeNull()
    expect(appPathFromLink('not a url', SITE)).toBeNull()
    expect(appPathFromLink('', SITE)).toBeNull()
  })
})

describe('onAppLink', () => {
  it('hands the opened url to the handler', async () => {
    const handler = vi.fn()
    await onAppLink(handler)

    plugin.listeners.get('appUrlOpen')?.({ url: `${SITE}/lessen` })
    expect(handler).toHaveBeenCalledWith(`${SITE}/lessen`)
  })

  it('does not throw where the app plugin does not exist', async () => {
    plugin.addListener.mockRejectedValue(new Error('Not implemented on web.'))
    await expect(onAppLink(vi.fn())).resolves.toBeUndefined()
  })
})
```

Run: `yarn vitest run app/utils/nativeLinks.test.ts` — expected: FAIL — cannot resolve `./nativeLinks`.

- [ ] **Step 5: Turning a link into an in-app path — implementation**

Create `app/utils/nativeLinks.ts`:

```ts
import { isMemberPath } from '~~/config/ios-target'

/**
 * The in-app path for a link that opened the app, or null when the link is not one of this site's member pages.
 * Only links on the site's own origin count: anything else must never steer the app.
 */
export function appPathFromLink(url: string, siteOrigin: string): string | null {
  let link: URL
  try {
    link = new URL(url)
  } catch {
    return null
  }
  if (link.origin !== siteOrigin || !isMemberPath(link.pathname)) return null
  return `${link.pathname}${link.search}`
}

/** iOS app: calls the handler when the app is opened through a link (a universal link from an email, for example). */
export async function onAppLink(handler: (url: string) => void): Promise<void> {
  try {
    const { App } = await import('@capacitor/app')
    await App.addListener('appUrlOpen', ({ url }) => handler(url))
  } catch {
    // No app plugin here (a desktop browser): there are no incoming links to handle
  }
}
```

Run: `yarn vitest run app/utils/nativeLinks.test.ts` — expected: 5 passed.

Create `app/plugins/native-links.client.ts`:

```ts
/**
 * iOS app only: a link to a member page (from a verification or password-reset email, for example)
 * opens that page in the app.
 */
export default defineNuxtPlugin(() => {
  const { isNativeApp, apiBase } = useNativeApp()
  if (!isNativeApp) return

  const router = useRouter()
  void onAppLink((url) => {
    const path = appPathFromLink(url, apiBase)
    if (path) void router.push(path)
  })
})
```

- [ ] **Step 6: The entitlement**

In `ios/App/App/App.entitlements`, directly before the final `</dict>` add:

```xml
	<key>com.apple.developer.associated-domains</key>
	<array>
		<string>applinks:www.ravennah.com</string>
	</array>
```

- [ ] **Step 7: Verify and commit**

Run: `yarn test:unit` — expected: all pass.
Run: `yarn test:e2e:branch` — expected: 7 passed.
Run: `yarn test:e2e:branch --app > /tmp/app-m3-5.log 2>&1; echo $?; grep -E "passed|failed" /tmp/app-m3-5.log` — expected: exit 0, `1 passed`.

```bash
git add config server/handlers app/utils/nativeLinks.ts app/utils/nativeLinks.test.ts app/plugins/native-links.client.ts e2e/universal-links.spec.ts nuxt.config.ts ios/App/App/App.entitlements package.json yarn.lock
git commit -m "Open member links from email in the iOS app (universal links)"
```

---

### Task 6: A self-contained app bundle

**Files:**
- Modify: `nuxt.config.ts`, `e2e/app-mode.spec.ts`

**Interfaces:**
- Produces: an iOS bundle that makes no icon requests at runtime and contains no pre-compressed duplicates of its files.

Background: with server rendering off, the icon module fetches icon data at runtime from `api.iconify.design` (or from a server endpoint the bundle does not have). And the website's build pre-compresses every public file with gzip and brotli, which the app's file server never uses.

- [ ] **Step 1: Write the failing guard**

In `e2e/app-mode.spec.ts`:

1. Directly after the test's opening line (`test('the app logs in ...', async ({ page, context }) => {`) add:

```ts
    // The app bundle must carry its own icons: no icon requests to any server
    const iconRequests: string[] = []
    page.on('request', (request) => {
        if (/iconify|_nuxt_icon/.test(request.url())) iconRequests.push(request.url())
    })
```

2. As the last line of the test, before its closing `})`, add:

```ts
    expect(iconRequests, 'icons fetched at runtime').toEqual([])
```

Run: `yarn test:e2e:branch --app > /tmp/app-m3-6a.log 2>&1; echo $?; grep -E "passed|failed|iconify|_nuxt_icon" /tmp/app-m3-6a.log | head -20`
Expected: exit 1, `1 failed`, with the fetched icon URLs listed. Paste them into your report.

- [ ] **Step 2: Bundle the icons and drop the compressed duplicates**

In `nuxt.config.ts`:

1. Replace

```ts
  icon: {
    mode: 'svg',
  },
```

with

```ts
  icon: {
    mode: 'svg',
    // The iOS app has no server to ask for icons: ship the ones the source uses inside the bundle
    ...(iosTarget ? { clientBundle: { scan: true } } : {}),
  },
```

2. In the `nitro` block replace

```ts
    compressPublicAssets: { gzip: true, brotli: true },
```

with

```ts
    // The app's own file server never serves .gz/.br copies, so the iOS bundle skips them
    compressPublicAssets: iosTarget ? false : { gzip: true, brotli: true },
```

Check `node_modules/@nuxt/icon/README.md` for the `clientBundle` option and its `scan` setting; if the installed version names it differently, use what the README says and note it.

- [ ] **Step 3: See the guard pass**

Run: `yarn test:e2e:branch --app > /tmp/app-m3-6b.log 2>&1; echo $?; grep -E "passed|failed|iconify|_nuxt_icon" /tmp/app-m3-6b.log | head -20`
Expected: exit 0, `1 passed`.

If icon requests remain, the scan missed icons whose names are built at runtime. Add exactly those names (from the listed URLs) under `clientBundle: { scan: true, icons: [...] }` and re-run. Do not weaken the guard.

Then check the bundle:

```bash
du -sh .output-ios/public
find .output-ios/public -name '*.br' -o -name '*.gz' | wc -l
```

Expected: the second command prints `0`. Put both outputs in your report.

- [ ] **Step 4: Confirm the website build is unchanged**

Run: `yarn build && find .output/public -name '*.br' | head -3` — expected: the build succeeds and `.br` files are still present for the website.
Run: `yarn test:e2e:branch` — expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add nuxt.config.ts e2e/app-mode.spec.ts
git commit -m "Bundle icons into the iOS app and drop pre-compressed duplicates"
```

---

### Task 7: Notification polish

**Files:**
- Modify: `app/components/AccountDetails.vue`, `shared/push.ts`, `server/utils/pushMessages.ts`, `server/utils/pushMessages.test.ts`, `server/utils/apns.ts`, `server/utils/apns.test.ts`, `server/api/sendLessonReminders.post.ts`

**Interfaces:**
- Consumes: `lessonStartInstant` from `shared/lesson` (Task 1).
- Produces: `PushPayload.expiresAt?: number` (Unix seconds); `lessonReminderPush(lessonType: string, address: string, lessonDate: Date): PushPayload`.

Two small gaps from milestone 2's review: someone who denied notifications in iOS Settings gets a browser-oriented error, and a reminder for a lesson can be delivered after the lesson to a phone that was switched off.

- [ ] **Step 1: A useful message when iOS notifications are switched off**

In `app/components/AccountDetails.vue`, in the `pushEnabled` setter, replace

```ts
        description: value
          ? 'Controleer of je meldingen hebt toegestaan in je browser.'
          : 'Probeer het later opnieuw.',
```

with

```ts
        description: value
          ? (isNativeApp
              ? 'Sta meldingen toe in Instellingen > Meldingen > Yoga Ravennah.'
              : 'Controleer of je meldingen hebt toegestaan in je browser.')
          : 'Probeer het later opnieuw.',
```

`isNativeApp` is already declared in this component (it hides the passkey settings in the app). If it is declared below the `pushEnabled` computed, that is fine: the setter only runs on a click.

- [ ] **Step 2: Reminder expiry — failing tests**

In `server/utils/pushMessages.test.ts`, replace the lesson-reminder test with:

```ts
  it('builds the lesson reminder with the address for the Route button, expiring when the lesson starts', () => {
    expect(lessonReminderPush('Hatha Yoga', 'Emmy van Leersumhof 24a, 3059 LT Rotterdam', new Date('2026-07-05T09:45:00.000Z'))).toEqual({
      title: 'Morgen yoga!',
      body: 'Je hebt morgen Hatha Yoga — tot dan!',
      url: '/lessen',
      category: 'LESSON_REMINDER',
      address: 'Emmy van Leersumhof 24a, 3059 LT Rotterdam',
      // 09:45 Dutch time in July is 07:45 UTC
      expiresAt: Date.parse('2026-07-05T07:45:00.000Z') / 1000,
    })
  })
```

In `server/utils/apns.test.ts` add:

```ts
  it('tells Apple to stop trying once the notification has expired, and does not send the expiry as tap data', async () => {
    const sendApns = await loadSender(CONFIGURED)
    await sendApns('device-token', { title: 'T', body: 'B', url: '/lessen', expiresAt: 1_783_237_500 })

    const { options } = apns.send.mock.calls[0][0]
    expect(options.expiration).toBe(1_783_237_500)
    expect(options.data).toEqual({ url: '/lessen' })
  })

  it('sets no expiry when the notification has none', async () => {
    const sendApns = await loadSender(CONFIGURED)
    await sendApns('device-token', { title: 'T', body: 'B' })

    expect(apns.send.mock.calls[0][0].options).not.toHaveProperty('expiration')
  })
```

Run: `yarn vitest run server/utils/pushMessages.test.ts server/utils/apns.test.ts` — expected: the three changed or new tests FAIL.

Check in `node_modules/apns2` (README or type definitions) that the `Notification` option for the expiry is called `expiration` and takes Unix seconds. If it is named differently, use the real name in both the code and the test and say so in your report.

- [ ] **Step 3: Reminder expiry — implementation**

In `shared/push.ts` replace

```ts
export type PushPayload = PushTapData & { title: string; body: string; category?: PushCategory }
```

with

```ts
export type PushPayload = PushTapData & {
  title: string
  body: string
  category?: PushCategory
  /** Unix seconds after which delivering the notification is pointless (a reminder for a lesson that has started). */
  expiresAt?: number
}
```

In `server/utils/pushMessages.ts`:

1. Change the import line to also bring in the start-time helper:

```ts
import { PUSH_CATEGORY, type PushPayload } from '../../shared/push'
import { lessonStartInstant } from '../../shared/lesson'
```

2. Replace `lessonReminderPush` with:

```ts
export function lessonReminderPush(lessonType: string, address: string, lessonDate: Date): PushPayload {
  return {
    title: 'Morgen yoga!',
    body: `Je hebt morgen ${lessonType} — tot dan!`,
    url: '/lessen',
    category: PUSH_CATEGORY.lessonReminder,
    address,
    // A phone that was off should not show "tomorrow" after the lesson has begun
    expiresAt: Math.floor(lessonStartInstant(lessonDate).getTime() / 1000),
  }
}
```

In `server/utils/apns.ts` replace

```ts
  const { title, body, category, ...data } = payload
```

with

```ts
  const { title, body, category, expiresAt, ...data } = payload
```

and in the `new Notification(deviceToken, { ... })` options, directly after the `...(category ? { category } : {}),` line add:

```ts
        ...(expiresAt ? { expiration: expiresAt } : {}),
```

In `server/api/sendLessonReminders.post.ts` replace

```ts
lessonReminderPush(lessonType, address)
```

with

```ts
lessonReminderPush(lessonType, address, lessonDate)
```

- [ ] **Step 4: Verify and commit**

Run: `yarn vitest run server/utils/pushMessages.test.ts server/utils/apns.test.ts` — expected: all pass.
Run: `yarn test:unit` — expected: all pass.

```bash
git add app/components/AccountDetails.vue shared/push.ts server/utils/pushMessages.ts server/utils/pushMessages.test.ts server/utils/apns.ts server/utils/apns.test.ts server/api/sendLessonReminders.post.ts
git commit -m "Explain denied iOS notifications and let lesson reminders expire"
```

---

### Task 8: The dark app icon by default

**Files:**
- Modify: `scripts/generate-icons.ts`, `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (regenerated)

**Interfaces:**
- Produces: an app icon set whose default icon is the dark design (dark background `#030712`, light figure `#d1fae5`), the same as its dark-mode variant. The tinted variant is unchanged.

Background: `scripts/generate-icons.ts` draws three iOS icons: the default one on an emerald gradient, a dark one, and a greyscale one for tinted mode. The owner wants the dark design to be the icon people see by default. The asset catalog (`Contents.json`) keeps its three entries: without an explicit dark entry iOS would darken the default icon itself.

- [ ] **Step 1: Record the current state**

```bash
cd ios/App/App/Assets.xcassets/AppIcon.appiconset && shasum -a 256 AppIcon-512@2x.png AppIcon-dark.png AppIcon-tinted.png && cd -
```

Expected: three different hashes. Keep them for the report.

- [ ] **Step 2: Make the generator draw the dark design for the default icon**

In `scripts/generate-icons.ts` replace

```ts
const emeraldField = `<linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#047857"/>
    <stop offset="1" stop-color="#064e3b"/>
  </linearGradient>`

const appIcon = { canvas: 1024, share: 0.64 }
await writeIosPng(figureSvg({ ...appIcon, background: 'url(#field)', fill: '#d1fae5', defs: emeraldField }), 'AppIcon.appiconset', 'AppIcon-512@2x.png')
await writeIosPng(figureSvg({ ...appIcon, background: '#030712', fill: '#d1fae5' }), 'AppIcon.appiconset', 'AppIcon-dark.png')
```

with

```ts
const appIcon = { canvas: 1024, share: 0.64 }
// The dark design is the app's icon in every appearance; the explicit dark entry stops iOS from darkening it further
const darkIcon = figureSvg({ ...appIcon, background: '#030712', fill: '#d1fae5' })
await writeIosPng(darkIcon, 'AppIcon.appiconset', 'AppIcon-512@2x.png')
await writeIosPng(darkIcon, 'AppIcon.appiconset', 'AppIcon-dark.png')
```

Leave `figureSvg`'s `defs` option in place only if something else still uses it; if nothing does after this change, remove the option and the `<defs>` element from the template so no dead parameter remains. Do not change `Contents.json`.

- [ ] **Step 3: Regenerate**

Run `yarn test:unit` first (expected: all pass), then:

```bash
yarn tsx scripts/generate-icons.ts
```

Expected: the script lists every file it wrote, without errors.

- [ ] **Step 4: Verify**

```bash
cd ios/App/App/Assets.xcassets/AppIcon.appiconset && shasum -a 256 AppIcon-512@2x.png AppIcon-dark.png AppIcon-tinted.png && cd -
git status --short
```

Expected:
- `AppIcon-512@2x.png` and `AppIcon-dark.png` now have the same hash, and `AppIcon-512@2x.png`'s hash differs from Step 1.
- `AppIcon-tinted.png` has the same hash as in Step 1.

The script also rewrites the website icons and the launch images. Those designs did not change: if `git status` shows any of them as modified, compare them (`git diff --stat`) and restore them with `git checkout -- <file>` when the difference is only re-encoding, so the commit contains nothing but the icon that actually changed. Name what you restored in your report.

Then read the regenerated `AppIcon-512@2x.png` as an image and confirm it shows the light figure on the dark background, not the emerald gradient.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-icons.ts "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
git commit -m "Use the dark app icon by default"
```

---

### Task 9: Native project, documentation and checklist

**Files:**
- Modify: `ios/App/CapApp-SPM/Package.swift` and `Package.resolved` (generated by `cap sync`), `ios/App/App/Info.plist` (only if Task 2's README check requires a usage description), `CLAUDE.md`

**Interfaces:**
- Consumes: the four plugins installed in Tasks 2–5.

Precondition: `git status --short ios/` must be clean before you start. If it is not, stop and report.

- [ ] **Step 1: Sync the plugins into the native project**

```bash
NUXT_PUBLIC_API_BASE=http://localhost:3000 yarn build:ios:bundle
npx cap sync ios
```

Expected: the sync output lists `@capacitor/app`, `@capacitor/haptics`, `@capacitor/push-notifications`, `@capacitor/share`, `@ebarooni/capacitor-calendar` and `capacitor-secure-storage-plugin`. If any plugin is reported as not supporting Swift Package Manager, stop and report BLOCKED with the output.

- [ ] **Step 2: Calendar usage description, only if required**

Task 2's report records what the calendar plugin's README requires in `Info.plist` for `createEventWithPrompt`. If it requires a usage-description key, add it to `ios/App/App/Info.plist` directly before the final `</dict>`, with this Dutch text as its string value:

```
Yoga Ravennah zet je geboekte les in je agenda.
```

Use exactly the key name(s) the README gives. If the README requires none, change nothing and say so.

- [ ] **Step 3: Verify the native project compiles**

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build | tail -3
```

Expected: `** BUILD SUCCEEDED **`. Paste the real tail into your report.

- [ ] **Step 4: Document**

In `CLAUDE.md`, directly after the paragraph that starts with `Push:` add this paragraph:

```
Native features: each lives in one util under `app/utils/` (`nativeCalendar`, `nativeHaptics`, `shareLesson`, `nativeLinks`, `nativePushDevice`) that imports its Capacitor plugin inside the function that uses it and never throws where the plugin is missing. Lesson address, title, calendar link and real start time come from `shared/lesson.ts`; lesson dates are stored as Dutch wall-clock time written as UTC, so use `lessonStartInstant` for anything that needs an absolute time. Universal links: `server/handlers/appleAppSiteAssociation.ts` serves `/.well-known/apple-app-site-association` from the same member-path list (`config/ios-target.ts`) that decides which pages the app contains.
```

- [ ] **Step 5: Commit**

```bash
git status --short
git add ios CLAUDE.md
git commit -m "Sync the native plugins for calendar, haptics, share and links"
```

Commit nothing under `ios/App/App/public`, `DerivedData`, `xcuserdata` or `ios/App/build`.

- [ ] **Step 6: Simulator and device checklist (owner, manual)**

In the simulator (`yarn dev` in one terminal, `yarn dev:ios` in another):
- [ ] Booking a lesson shows "Zet de les in je agenda"; tapping "Zet in agenda" opens the iOS event sheet with the title, the studio address and the right time, and no permission prompt.
- [ ] The Boekingen tab shows one "Zet in agenda" button and not the three calendar icons.
- [ ] Every lesson on `/lessen` has "Deel deze les"; it opens the share sheet with the text and the trial-lesson link.
- [ ] With the Mac's network switched off, the app still shows its icons.
- [ ] On the home screen, with the simulator in light appearance, the app icon is the dark design (light figure on a dark background).

On a real iPhone with a TestFlight build (haptics and universal links do not work in the simulator against a local server):
- [ ] Booking gives a tap; cancelling gives a different one.
- [ ] A password-reset email opened in Mail opens the app on the reset page.
- [ ] A link to `https://www.ravennah.com/tarieven` still opens Safari.
- [ ] A password-reset link opens the app on the reset page when the app was force-quit.
- [ ] A verification link works while logged out in the app.
- [ ] A second reset link, opened while the reset page is already showing, uses the new link.
- [ ] As an admin, a link to https://www.ravennah.com/archief opens the archive in the app.
- [ ] A reset email requested from inside the app contains a link starting with https://www.ravennah.com.

## Release steps for the owner

Nothing here needs a database change, so merging is safe at any time.

1. Merge the pull request; the website deploys. After the deploy, `https://www.ravennah.com/.well-known/apple-app-site-association` must return JSON.
2. Confirm the association file is live: `https://www.ravennah.com/.well-known/apple-app-site-association` returns JSON without a redirect, and `https://app-site-association.cdn-apple.com/a/v1/www.ravennah.com` shows the same content (Apple's copy can lag behind).
3. In the Apple developer account, enable **Associated Domains** on the App ID `com.ravennah.app` (Xcode's automatic signing usually does this when it sees the entitlement).
4. Build and upload a new TestFlight build (`yarn build:ios`, then archive in Xcode).
5. Do the real-iPhone part of the checklist. iOS fetches the association file when the app is installed, so universal links only work for a build installed after step 1.

## Self-review notes

- Spec section 4: calendar (Task 2), shared lesson details (Task 1), haptics (Task 3), share sheet (Task 4), universal links (Task 5). The badge shipped in milestone 2; app icon and splash were replaced by the owner; safe areas already work; links leaving the member area open the website since milestone 1.
- Added by the owner while planning: the dark app icon by default (Task 8).
- Carried over from earlier reviews: icons loaded from a third-party server (Task 6), the denied-notifications message and reminder expiry (Task 7).
- Not in this milestone: removing unused marketing photos from the bundle, `NSAllowsLocalNetworking` in release builds, a lesson-specific destination for notification buttons, account deletion, App Store submission.
