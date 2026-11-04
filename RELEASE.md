# Release 1.0: Work List and App Store Checklist

Status on 2026-11-04: the "Must do" and most "Should do" items are done (not committed yet). `pnpm typecheck` passes, `pnpm test` passes 19 tests. A Release build runs on the iOS simulator with Xcode 27.2. The target is the iOS App Store. Android is not in scope until we decide it.

## 1. Decisions (from Chris)

- [ ] **App name.** "Heatmap" is not usable: "HeatMap: Habit Tracker", "Habit Heatmap" and "HeatMap: Live Stocks & Futures" exist, and "Footprints — Walking Heatmap" exists too. Working candidate in `fastlane/metadata/en-US/name.txt`: "Heatmap: Places I've Been". Other options: "Wander: My Location Heatmap", "Heat Trails: Location Heatmap". Only App Store Connect can confirm that a name is free. The name under the icon on the home screen stays "Heatmap".
- [ ] **Icon.** Chris rejected the first candidate in `assets/icon.png`. Six new concepts are rendered for a decision: A pin on a heat glow, B heat footprints, C light street map with a heat trail, D contour bands, E route into a hot spot, F dot matrix. The chosen concept goes into `scripts/generate-icon.swift`.
- [x] **iPad.** Not supported in 1.0 (`supportsTablet: false`). No iPad screenshots are necessary.
- [ ] **Price.** Free or paid. Paid needs the Paid Apps agreement and tax and bank data.
- [ ] **Category.** Draft: primary "Travel", secondary "Navigation".
- [ ] **Countries and EU trader status.** For the EU, Apple requires the DSA trader status. A trader's address, phone and email show on the App Store page.
- [ ] **Contact email** for the privacy policy and the support page (both are public).
- [ ] **Where the privacy policy and support pages go.** This repo is private, and the Google Maps iOS key is in its history since the first commit. Recommendation: a small separate public repo (for example `zirkelc/heatmap-app`) with the two pages, GitHub Pages turned on, and GitHub Issues as the support channel. Then no email address must be public. Drafts: `docs/privacy-policy.md`, `docs/support.md`.
- [ ] **Android.** In scope for 1.0 or not. `app.json` still has the Android Maps key placeholder and the template Android icons.

## 2. Work to finish the app

### Done

- [x] App icon and splash image (candidate, see "Decisions").
- [x] Only the "When In Use" permission. Tracking that starts in the app continues in the background with the iOS location indicator.
- [x] Short explanation before the first system prompt, and an "Open Settings" alert when the permission is off.
- [x] No empty series after a denied permission or a failed start.
- [x] One clear location purpose text for all 3 iOS keys, set through the `expo-location` plugin. No duplicate keys in `app.json`.
- [x] The series that records cannot be deleted. A merge that contains it always merges into it.
- [x] The map fits the points only after a filter change, not on each new point. Without data, it shows the user's location (no permission prompt at launch).
- [x] Safe area on the map screen (chip, status pill, button, Google logo) and bottom padding of the History list.
- [x] Tracking state repair at launch and each time the app comes back to the foreground.
- [x] Privacy manifest (`ios.privacyManifests` in `app.json`).
- [x] One shared database connection for the background task.
- [x] The map loads only latitude, longitude and weight, filtered by series in SQL.
- [x] Points with an accuracy worse than 100 m are not saved.
- [x] Filter sheet with all series (the alert showed only 5).
- [x] The series detail updates live. Fixed the stats that showed only the weekday.
- [x] Removed dead code (unreachable rename dialog, old hooks, unused connection helpers).
- [x] Expo packages updated to the versions that SDK 54 expects.
- [x] Vitest tests for the queries, the tracking rules, the region and the demo data, on `sql.js` with the real migration.
- [x] Pods with a deployment target below iOS 15.1 fail on Xcode 27. A config plugin (`plugins/withPodsDeploymentTarget.js`) raises them.
- [x] The heatmap gradient reaches red earlier, so places with many points stand out.

### Open

- [ ] **Google Maps API key.** Restrict the iOS key in Google Cloud Console to the bundle ID `dev.zirkelc.heatmap` and to the Maps SDK for iOS. Only Chris can do this.
- [ ] **Real device test** of a Release build (or the TestFlight build): grant "While Using", lock the phone for 30 minutes while you walk, open the app again, stop. Also: deny the permission, then start again (the "Open Settings" alert must show).
- [ ] **Expo SDK.** SDK 54 builds with Xcode 27.2 locally. EAS chooses its own Xcode image. If Apple requires a newer SDK at upload time, upgrade then.

### Later (after 1.0)

- Export (GPX, KML), statistics, heatmap style settings, iCloud backup, localization (dates are fixed to `en-US`), dark mode, Android release.

## 3. Store listing material

Drafts are in `fastlane/metadata/` (the layout of `fastlane deliver`).

- [x] Name (draft), subtitle, promotional text, description, keywords (96 of 100 characters)
- [x] Copyright, primary and secondary category
- [x] App Review notes (`fastlane/metadata/review_information/notes.txt`)
- [x] Privacy policy and support page drafts (`docs/`), missing the contact email and the final name
- [ ] Support URL and privacy policy URL (after hosting is decided)
- [x] Screenshots, iPhone 6.9 inch (1320x2868): `scripts/take-screenshots.sh` writes 5 images to `fastlane/screenshots/en-US/` (ignored by git)
- [ ] Age rating questionnaire (expected result: 4+)
- [ ] App Privacy answers. Draft, from the privacy manifest that `react-native-maps` ships for Google Maps SDK 8.4.0:
  - Data not linked to the user, not used for tracking: Crash Data (Analytics), Device ID (Analytics, App Functionality), Performance Data (Analytics), Product Interaction (Analytics).
  - Data linked to the user, not used for tracking: User ID (Analytics).
  - Location: the app's own recorded points never leave the device, so they are not "collected" in Apple's meaning. The Google manifest declares no location.
- [x] Export compliance: `ITSAppUsesNonExemptEncryption: false`
- [ ] Third-party content: yes (Google map tiles)

## 4. Access for the submission

Known: the Apple Team ID is `D568Q9VY3L` (from the Typoless project; set in `eas.json`). Typoless ships outside the App Store, so there is no App Store Connect API key on this Mac to reuse.

- [ ] **App Store Connect API key.** App Store Connect > Users and Access > Integrations > App Store Connect API > Team Keys > Generate API Key. Only the Account Holder or an Admin can do this. The first time, the Account Holder must request API access. Role "Admin" (so that EAS can also create the certificate and the provisioning profile). Download the `.p8` at once (only one download is possible), and note the Key ID and the Issuer ID. Store the `.p8` outside the repo, for example `~/.appstoreconnect/private_keys/`.
- [ ] **App record** in App Store Connect: Apps > "+" > New App, platform iOS, the final name, bundle ID `dev.zirkelc.heatmap`, SKU for example `heatmap`. The API cannot create it. If the bundle ID is not in the list, register it first in the Apple Developer portal (Identifiers), or let the first `eas build` register it.
- [ ] **Expo access token** (`EXPO_TOKEN`) for the account that owns project `597ee4bf-187c-4d9c-a3ab-284d2fc7a34d`: expo.dev > Account settings > Access tokens. There is no Expo login on this Mac now.
- [ ] **Web-only steps:** App Privacy answers and DSA trader status have no API. Chris does them in the browser, or logs in to App Store Connect in a browser that the agent can control.

## 5. Submission runbook

1. Commit the work. Test a Release build on a real iPhone (see "Open").
2. Add `ascAppId`, `ascApiKeyPath`, `ascApiKeyId` and `ascApiKeyIssuerId` to `submit.production.ios` in `eas.json`.
3. Build: `eas build --platform ios --profile production`. EAS manages the distribution certificate and the provisioning profile with the API key.
4. Upload: `eas submit --platform ios --profile production --latest`. Then read the email from Apple for privacy manifest warnings.
5. TestFlight: install the build on the iPhone and do a last check.
6. Screenshots: `scripts/take-screenshots.sh` (builds a Release app with demo data in Berlin, sets a 9:41 status bar, opens each screen with launch arguments, no taps).
7. Metadata and screenshots: `fastlane deliver` with the API key (`brew install fastlane`), from `fastlane/metadata` and `fastlane/screenshots`.
8. Web steps: App Privacy, age rating, DSA trader status, pricing and availability.
9. Select the build, check the review notes, submit for review with manual release.
10. If Apple rejects: read the message, fix, send a new build.
