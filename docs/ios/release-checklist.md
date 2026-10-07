# iOS app — release checklist

Everything between "the code is merged" and "the app is in the App Store", in order. Builds are archived by hand in Xcode. Steps marked **(owner)** need the Apple developer account, App Store Connect or a real iPhone.

Related: [App Store listing text](app-store-listing.md), [privacy label answers](app-privacy-labels.md).

## 0. Decide before the first submission

- [ ] **iPhone only, or iPhone and iPad?** The project currently targets both (`TARGETED_DEVICE_FAMILY = "1,2"`). With iPad included, App Store Connect requires 13-inch iPad screenshots and Apple may review the app on an iPad. iPad support cannot be removed after the first release. To ship iPhone only: in Xcode, target App → General → Supported Destinations, remove iPad (and Mac / Vision if listed), and commit the change.
- [ ] **Reviewer's booking.** Decided: the reviewer account is a normal member account; a booking it makes takes one real spot until an admin removes the attendee.

## 1. The live site is ready

- [ ] Account deletion is live: on https://www.ravennah.com, a member sees "Account verwijderen" under Account → Instellingen (pull request #286).
- [ ] Check deletion once with a throwaway account: register, delete, both emails arrive (member and info@ravennah.com), the account shows as "Verwijderd account" and archived in the admin user list.
- [ ] https://www.ravennah.com/privacy opens and mentions deleting the account yourself.
- [ ] https://www.ravennah.com/.well-known/apple-app-site-association returns JSON without a redirect.
- [ ] Production has `NUXT_APNS_KEY`, `NUXT_APNS_KEY_ID`, `NUXT_APNS_TEAM_ID` and `NUXT_APNS_PRODUCTION=true`. Without the last one, TestFlight and App Store builds receive no notifications.

## 2. The reviewer account (owner)

- [ ] Register a new account on the live site with an email address you control and a password (Apple cannot use a passkey or an emailed code).
- [ ] Verify its email address.
- [ ] As admin, add a few credits to it. Do not make it an admin: an admin does not see "Account verwijderen", and Apple checks for that button.
- [ ] Make sure at least one upcoming lesson has free spots during the review.
- [ ] Put the email address and password in App Store Connect → App Review Information (never in this repository).
- [ ] After the review: remove any booking it made, and keep the account for later updates.

## 3. Build and upload (owner)

- [ ] On an up-to-date `master`: `yarn install`, then `yarn build:ios`. This builds the member bundle against https://www.ravennah.com and syncs it into `ios/`.
- [ ] Open `ios/App/App.xcodeproj` in Xcode. Version is `1.0`; the build number must be higher than any build uploaded before (Xcode offers to raise it during upload).
- [ ] Select "Any iOS Device (arm64)", then Product → Archive.
- [ ] In the Organizer: Distribute App → App Store Connect → Upload. Xcode switches the push entitlement to production by itself.
- [ ] Wait for the "build has completed processing" email. An email about a missing privacy manifest or API reason (ITMS-91053) means a privacy manifest must be added before submitting; none is expected, because the app's own Swift code uses no such API and the plugins declare their own.

## 4. Check the TestFlight build on a real iPhone (owner)

Install the build from TestFlight (not from Xcode: a debug build cannot receive notifications from the live site).

Login and booking
- [ ] Log in with a password; force-quit and reopen: still logged in.
- [ ] Book a lesson: a tap is felt, and "Zet de les in je agenda" appears. "Zet in agenda" opens the event sheet with title, studio address and the right time.
- [ ] Cancel a booking: a different tap is felt.
- [ ] "Deel deze les" on `/lessen` opens the share sheet.

Notifications
- [ ] Switch on Pushberichten under Instellingen; allow notifications.
- [ ] Logged in as admin in the app with Pushberichten on, press the test-notification button on the Omzet tab (in the app or on the website): it arrives on the phone. The test only goes to the admin's own devices.
- [ ] As a member with a booking, the reminder arrives the evening before the lesson.
- [ ] Each action button on a notification opens the right screen; the badge clears when the app opens.

Links
- [ ] A password-reset email opened in Mail opens the app on the reset page, also when the app was force-quit.
- [ ] A verification link works while logged out in the app.
- [ ] A link to https://www.ravennah.com/tarieven opens Safari, not the app.

Account deletion
- [ ] With a throwaway account in the app: Instellingen → "Account verwijderen" → type `VERWIJDER` → the app returns to the login page, and logging in with the old password fails.

## 5. App Store Connect (owner)

- [ ] App record: name, subtitle, description, keywords, promotional text and URLs from [app-store-listing.md](app-store-listing.md).
- [ ] Category: Health & Fitness. Price: free. Availability: at least the Netherlands.
- [ ] Screenshots: 6.9-inch iPhone is required; 13-inch iPad too if iPad stays supported (see step 0). Not prepared in this repository yet.
- [ ] App Privacy: answer the questionnaire from [app-privacy-labels.md](app-privacy-labels.md). Privacy policy URL: https://www.ravennah.com/privacy.
- [ ] Age rating questionnaire: no restricted content.
- [ ] EU Digital Services Act: declare trader status and supply the contact details Apple shows on the product page. Yoga Ravennah has no Chamber of Commerce number; the address is the studio (Emmy van Leersumhof 24a, 3059 LT Rotterdam) and the contact address info@ravennah.com.
- [ ] Export compliance: already answered in the app (`ITSAppUsesNonExemptEncryption` is false).
- [ ] App Review Information: the reviewer account from step 2, a contact phone number and email, and the review notes from the listing document.
- [ ] Select the build from step 3 and submit for review.

## 6. After approval (owner)

- [ ] Release the app (manually or automatically, as chosen at submission).
- [ ] Install it from the App Store and repeat the login and one notification check.
- [ ] Remove the reviewer's booking, if any.

## Known and accepted

- `NSAllowsLocalNetworking` is also set in release builds (it is needed for `yarn dev:ios`); it only permits plain connections to local network addresses.
- The bundle contains marketing photos the app does not show.
