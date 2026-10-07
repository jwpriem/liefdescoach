# iOS app — answers for App Store Connect's privacy questionnaire

Derived from what the app and its server store (`server/database/schema.ts`) and from the privacy statement (`app/pages/privacy.vue`). The owner reviews and enters these in App Store Connect → App Privacy.

## The short answers

- **Does the app collect data?** Yes.
- **Is any data used to track the user?** No. The app bundle contains no analytics and no advertising code (Google Tag Manager is only on the website, and is left out of the app build), and no data is shared with data brokers or used for advertising.
- **Is all collected data linked to the user's identity?** Yes: everything is stored with the member's account.
- **Purpose for every item:** App Functionality only.

## Per data type

| Apple's data type | Collected | What it is here | Linked to user | Tracking | Purpose |
|---|---|---|---|---|---|
| Contact Info → Name | Yes | The member's name | Yes | No | App Functionality |
| Contact Info → Email Address | Yes | Login and booking emails | Yes | No | App Functionality |
| Contact Info → Phone Number | Yes | Optional phone number | Yes | No | App Functionality |
| Health & Fitness → Health | Yes | Optional injuries and remarks for the teacher | Yes | No | App Functionality |
| Sensitive Info | Yes | Optional pregnancy and due date (Apple lists pregnancy information under Sensitive Info) | Yes | No | App Functionality |
| Identifiers → User ID | Yes | The account id that bookings and credits belong to | Yes | No | App Functionality |
| Identifiers → Device ID | Yes | The push notification token of the iPhone, only when notifications are switched on | Yes | No | App Functionality |
| Purchases → Purchase History | Yes | Credits and the lessons booked with them | Yes | No | App Functionality |
| Other Data | Yes | Optional date of birth; at each login the IP address, the type of device and the time | Yes | No | App Functionality |

Everything else is **not collected**: location, contacts, photos, user content, browsing or search history, financial or payment details (lessons are paid in person; credits are added by the studio), usage data, diagnostics.

## Points that are a judgement call

- **Purchase History.** Credits are not bought in the app, so this could also be left out. Declaring it is the cautious choice, because the app shows the member's credits and bookings.
- **Login IP address and device type.** Apple has no exact category for these. "Other Data" is used here; they are kept for account security and are not used to derive a location.
- **Calendar.** The app only writes an event to the calendar when the member asks; it reads nothing, so nothing is collected.
- **ClassPass.** Names received from ClassPass are entered by the studio and do not pass through the app.

## When this changes

Update this sheet, the labels in App Store Connect and the privacy statement together when a table or `students` column with personal data is added, or when anything analytic is added to the app bundle.
