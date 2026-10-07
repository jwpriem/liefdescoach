# Yoga Ravennah iOS app — design

Date: 2026-10-06
Status: awaiting review

## Goal

A dedicated iOS app for the member area of ravennah.com, published through the App Store, with native push notifications and a small set of native features that make it more than the website in a frame.

## Decisions made

| Topic | Decision |
|---|---|
| Technology | Capacitor wrapping the existing Nuxt app, in this repo |
| App content | Member area only: `/login`, `/lessen`, `/account`, `/archief`, `/admin/**`, `/verify-email`, `/reset-wachtwoord` |
| UI delivery | Bundled inside the app (client-only build), talking to `https://www.ravennah.com/api` |
| Login | Session token in the iOS Keychain, sent as an `Authorization: Bearer` header |
| First release | Native push with action buttons, native calendar add, badge, haptics, share sheet, universal links, account deletion |
| Platform | iOS only; nothing may block Android later |
| App name / bundle ID | "Yoga Ravennah" / `com.ravennah.app` (bundle ID is permanent after first upload) |

## Out of scope for the first release

- Passkey login inside the app (needs a native passkey plugin and associated domains)
- Home/lock screen widget
- Apple Wallet pass for credits
- HealthKit
- New notification types (for example "a spot opened up")
- Android
- Google Tag Manager or any tracking inside the app

## 1. Project structure and build

Capacitor adds `capacitor.config.ts` at the repo root and an `ios/` folder with the Xcode project. No second repo, no copied UI code.

One codebase, two build targets:

| | Web | iOS app |
|---|---|---|
| Command | `yarn build` | `yarn build:ios` |
| Output | Nitro server + pages | static client-only bundle, synced into `ios/` |
| Pages | all | member pages only |
| API | same server | `https://www.ravennah.com/api` |

A single build flag, read in `nuxt.config.ts`, switches the iOS target:

- Marketing and SEO pages are excluded from the bundle; `/` redirects to `/account`, or `/login` when signed out.
- A new public runtime setting `apiBase` is `https://www.ravennah.com` (empty for web).
- `@vite-pwa/nuxt` is disabled (no service worker, no `push-sw.js`).
- The Google Tag Manager script and noscript are omitted.

`useNativeApp()` is the one composable that answers "am I inside the iOS app?" and exposes the native feature wrappers of section 4. Components never check the platform themselves.

`yarn dev:ios` runs the simulator against the normal `yarn dev` server with live reload, so it uses the Neon `dev` branch and never production.

Sign-up remains available in the app. The admin tabs and `/archief` are included.

## 2. Login and API client

### Recognising the app

A server helper `isNativeAppRequest(event)` returns true when the request `Origin` equals the app origin (`capacitor://localhost`, held in runtime config so tests can override it). For those requests only:

- The session is read from the `Authorization` header; cookies are ignored.
- CSRF protection is skipped. A website in a browser cannot forge that origin, and a client that can forge it holds no victim cookies.
- CORS is allowed for that origin, including preflight, with the session-token response header exposed.

Every other origin keeps today's behaviour: cookie sessions, CSRF enforced, `/api/**` same-origin only.

### Server changes

| File | Change |
|---|---|
| `server/utils/auth-session.ts` | `createSession` returns the token in a response header for app requests instead of setting a cookie. `getSessionUser` and session deletion read the bearer token for app requests. |
| `server/utils/csrf.ts` | `requireCsrfProtection` returns early for app requests. |
| new server middleware | CORS and preflight responses for the app origin. |

The four `createSession` call sites (password login, register, email code, passkey verify) are not edited.

Sessions last 30 days (`SESSION_MAX_AGE`). If sessions do not already renew on use, app sessions are renewed on use so app users stay signed in.

### Client changes

`app/plugins/csrf.client.ts` already wraps the global `$fetch`. It becomes the single API plugin:

- Web: unchanged behaviour (CSRF token on mutating requests).
- App: prefixes `apiBase`, attaches the bearer token from the Keychain, stores a token when a response carries one, clears it on logout or a 401, and skips the CSRF token.

No `$fetch` call site changes.

### Differences in the app

- Passkey login and passkey management are hidden. `server/utils/passkeys.ts` derives the relying-party ID from the request origin, which does not work from a bundled app. Login is by password or email code.

## 3. Push notifications

### Storage

`push_subscriptions` is extended rather than duplicated:

| Column | Change |
|---|---|
| `platform` | new, `'web'` or `'ios'`, default `'web'` |
| `endpoint` | unchanged; holds the APNs device token for iOS rows; unique index kept |
| `p256dh`, `auth` | become nullable |

The migration is additive. It is dry-run on a throwaway Neon branch and the output presented before it is applied anywhere. The table stays classified `wipe` in `scripts/lib/anonymise.ts`.

### Sending

`server/utils/push.ts` keeps `sendPushToStudent` and `sendPushToAdmins`. `sendToSubscription` dispatches on `platform` to web push or APNs. Invalid iOS tokens are deleted the same way expired web subscriptions are. `bookingNotifications.ts` and `sendLessonReminders.post.ts` only change to pass the extra payload fields below.

The push payload gains optional fields: `category` (which button set), plus the identifiers a button needs (`lessonId`, `studentId`, lesson address). Every push sets the badge to 1.

New private runtime settings: APNs key, key ID, team ID, bundle ID, and a flag selecting Apple's sandbox or production server.

### In the app

`usePushNotifications` keeps its interface (`isSupported`, `isSubscribed`, `subscribe`, `unsubscribe`). In the app it registers with iOS and posts the device token to `/api/push/subscribe`, which accepts `{ platform: 'ios', token }` next to the web format. `/api/push/unsubscribe` accepts the same.

- Permission is requested at the first opening of the app, and again after the first successful booking if it is still undecided. The device is registered with the server once a user is logged in. The toggle in `AccountDetails.vue` remains the manual switch.
- The app re-registers its token on each start. Logout removes that device's row.
- Tapping a notification navigates to its `url`.

### Action buttons

All buttons open the app at a destination; none perform background work.

| Notification | Recipient | Buttons |
|---|---|---|
| "Morgen yoga!" | student | Route (Apple Maps to the lesson address), Bekijk les |
| "Nieuwe boeking" / "Annulering" | admins | Bekijk deelnemers |
| "Credits op" | admins | Credits toevoegen (that student's admin page) |

No cancel button on the reminder: it is sent the day before and may arrive inside the 24-hour cancellation window.

### Added after milestone 1's review

- **Session kind:** `sessions` gains a `kind` column (`'web'` or `'app'`, default `'web'`), added in the same migration as the push columns. A session is only accepted on the path it was created for, so a website cookie cannot be replayed as an app token. Sessions created before the migration count as website sessions.
- **Migrations are applied with a per-migration script** (dry run on a throwaway branch of `seed`, then apply to a named database). `drizzle-kit migrate` is not used: the database's migration table is out of sync with the journal.
- **Deploy order:** the migration is applied to production before the code that reads the new columns is deployed.

## 4. Other native features

Each is exposed through `useNativeApp()` with a web fallback or a no-op outside the app.

- **Calendar:** in the app, the three calendar icons in `AccountBookings.vue` become one "Zet in agenda" button that opens the iOS event sheet prefilled with title, time and address. The same offer appears after a successful booking. The system sheet adds the event, so no calendar permission is requested. The web keeps its three links.
- **Shared lesson details:** lesson title and address are derived in `app/plugins/rav.ts`, `server/utils/bookingNotifications.ts` and `server/api/sendLessonReminders.post.ts`. One shared helper, importable by client and server, replaces all three and serves the calendar event and the Route button.
- **Badge:** set to 1 by every push, cleared when the app opens.
- **Haptics:** booking confirmed, cancellation confirmed, action failed. Wired once in `useBookingActions.ts`.
- **Share sheet:** a share button per lesson with a short Dutch text (type, day, time) and a link to `https://www.ravennah.com/eerste-les`. Shown in the app and in browsers that support sharing.
- **Universal links:** `/lessen`, `/account`, `/archief`, `/admin/*`, `/login`, `/verify-email`, `/reset-wachtwoord` open the app when installed. Requires an `apple-app-site-association` file served as JSON under `/.well-known/` on ravennah.com and the Associated Domains capability. Marketing pages keep opening in Safari.
- **Basics:** app icon and splash from `public/icon-source.svg`; safe-area handling; links leaving the member area open in Safari.

## 5. Account deletion

Available on web and in the app from the same component.

A hard delete is not used: `credits.student_id` has no delete rule, so it would fail for anyone with credit history, and forcing it would remove records `revenue.get.ts` reports on. The account is anonymised in place, with no schema change.

| Data | Result |
|---|---|
| Student row | name set to "Verwijderd account"; email, password hash, phone, date of birth cleared; `archived` set |
| Health, sessions, passkeys, push subscriptions, login history, pending email codes | deleted |
| Past bookings, credit history | kept, attached to the anonymous row |
| Upcoming bookings | cancelled, including inside the 24-hour window; spots freed |
| Unused credits | forfeited |
| Email address | freed for a new sign-up |

Flow:

- "Account verwijderen" button at the bottom of `AccountDetails.vue`.
- A dialog lists the consequences, including the number of unused credits that will be lost, and requires typing a confirmation word.
- A new authenticated endpoint performs the steps in one transaction, then signs the user out.
- The user receives a confirmation email (sent before the address is cleared) and the studio receives a notice.
- Admin accounts cannot delete themselves.

## 6. Testing

| Layer | Coverage |
|---|---|
| Unit | `isNativeAppRequest`; bearer and cookie sessions side by side; CSRF skipped for the app and enforced for the web; push dispatch by platform with APNs mocked; invalid-token cleanup; subscribe/unsubscribe with iOS tokens; account deletion (anonymising, cancelling upcoming bookings, refusing admins); shared lesson-details helper |
| E2E | Existing booking and registration specs unchanged; one new account-deletion spec |
| E2E, app mode | One smoke spec: the iOS-target bundle served on its own origin (configured as the app origin for the run), token login and a booking through the cross-origin path |

Tests are written before the code they cover. No existing code is deleted without running the suite.

Manual device checklist: push delivery and each action button's destination; calendar sheet; share sheet; badge clearing; haptics (real iPhone); universal links (after the association file is live).

## 7. Build order

Each milestone leaves the website fully working. Server parts ship to production before the app that needs them.

1. **App shell and login:** iOS build target, `useNativeApp()`, token auth, CORS, API plugin. Result: log in and book in the simulator.
2. **Push:** migration with dry run, APNs sender, app registration, action buttons, badge.
3. **Native features:** shared lesson helper, calendar, haptics, share, universal links.
4. **Account deletion:** web and app together.
5. **Release:** `/privacy` page, TestFlight, App Store submission.

## 8. App Store requirements

- **Privacy policy URL:** no privacy page exists in `app/pages`. A `/privacy` page is added to the website; its text is supplied or approved by the owner and states that anonymous booking and credit records remain after deletion.
- **Privacy labels:** contact details (name, email, phone), health details (injury, pregnancy), device token. No tracking.
- **Reviewer login:** a password account on production with credits. How the reviewer's test booking is kept from taking a real spot is decided before submission.
- **Listing:** Dutch description, screenshots, category Health & Fitness, support URL, age rating.
- **Payments:** credits are added by an admin for in-person lessons; no in-app purchase.

## 9. Needed from the owner

- Bundle ID registered with Push Notifications and Associated Domains capabilities.
- An APNs key (`.p8`), key ID and team ID, stored as environment variables, never in the repo.
- Privacy policy text.
- App Store listing text and approval of screenshots.

## 10. To verify during planning

Each item has a default so the plan is not blocked.

| Question | Default if unverified |
|---|---|
| Do sessions renew on use today? | Add renewal for app sessions |
| Can notification action buttons be registered without custom Swift? | Add the few lines to the app's Swift startup file |
| Can Capacitor use Swift Package Manager (CocoaPods is not installed)? | Install CocoaPods |
| Which Keychain, calendar and badge plugins are maintained for the chosen Capacitor version? | Choose in the plan, one plugin per feature, each behind `useNativeApp()` |
| What time does the reminder cron run? | Keep the reminder without a cancel button |
| How are production migrations applied today? | Follow the existing process after the branch dry run |
