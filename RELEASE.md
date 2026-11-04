# Release 1.0: Work List and App Store Checklist

Status on 2026-11-04: the "Must do" and most "Should do" items are done (not committed yet). `pnpm typecheck` passes, `pnpm test` passes 19 tests. A Release build runs on the iOS simulator with Xcode 27.2. The target is the iOS App Store. Android is not in scope until we decide it.

## 1. Decisions (from Chris)

- [x] **App name.** "Heatmap: Where I've Been" (`fastlane/metadata/en-US/name.txt`). The name under the icon on the home screen stays "Heatmap". App Store Connect confirms that the name is free when we create the app record.
- [x] **Icon.** Dot matrix with a heat walk, made by `scripts/generate-icon.swift`.
- [x] **iPad.** Not supported in 1.0 (`supportsTablet: false`). No iPad screenshots are necessary.
- [ ] **Price.** Free or paid. Paid needs the Paid Apps agreement and tax and bank data.
- [ ] **Category.** Draft: primary "Travel", secondary "Navigation".
- [ ] **Countries and EU trader status.** For the EU, Apple requires the DSA trader status. A trader's address, phone and email show on the App Store page.
- [ ] **Contact email** for the privacy policy and the support page (both are public).
- [ ] **Where the privacy policy and support pages go.** Plan: make this repo public after the Google Maps key is replaced, and link the pages on GitHub. The key is no longer in `app.json`: `app.config.ts` reads `GOOGLE_MAPS_IOS_API_KEY` from `.env.local` (local, ignored by git) or from the EAS environment variable (sensitive) for EAS builds. Drafts: `docs/privacy-policy.md`, `docs/support.md`.
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

- [x] **Google Maps API key.** New key "Heatmap iOS (App Store)" in Google Cloud project `heatmap-449913`, restricted to `dev.zirkelc.heatmap` and to the Maps SDK for iOS. It is in `.env.local` and works on the simulator. It is also the EAS environment variable `GOOGLE_MAPS_IOS_API_KEY` (sensitive). Open: Chris deletes the old key "Maps Platform API Key" (in the git history) in the console.
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
- [x] Age rating questionnaire (all answers "None" or "No", set through the API)
- [x] App Privacy answers entered (not published: "Publish" needs the privacy policy URL). Answers, from the privacy manifest that `react-native-maps` ships for Google Maps SDK 8.4.0:
  - Data not linked to the user, not used for tracking: Crash Data (Analytics), Device ID (Analytics, App Functionality), Performance Data (Analytics), Product Interaction (Analytics).
  - Data linked to the user, not used for tracking: User ID (Analytics).
  - Location: the app's own recorded points never leave the device, so they are not "collected" in Apple's meaning. The Google manifest declares no location.
- [x] Export compliance: `ITSAppUsesNonExemptEncryption: false`
- [ ] Third-party content: yes (Google map tiles)

## 4. Access for the submission

Known: the Apple Team ID is `D568Q9VY3L` (from the Typoless project; set in `eas.json`). Typoless ships outside the App Store, so there is no App Store Connect API key on this Mac to reuse.

- [x] **App Store Connect API key.** Team key "EAS", role Admin, Key ID `7475LHDY74`, Issuer ID `e014f779-1183-4a6b-a68b-93769aac2358`. The `.p8` is in `~/.appstoreconnect/private_keys/` (keep a backup in the password manager). `eas.json` uses it for `eas submit`. For `eas build`, set `EXPO_ASC_API_KEY_PATH`, `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID` and `EXPO_APPLE_TEAM_ID`.
- [x] **App record.** "Heatmap: Where I've Been", Apple ID `6830774275`, SKU `heatmap`, primary language English (U.S.).
- [x] **Expo login.** eas-cli is logged in as `zirkelc` on this Mac (device login).
- [ ] **Web-only steps:** App Privacy answers and DSA trader status have no API. Chris does them in the browser, or logs in to App Store Connect in a browser that the agent can control.

## 5. Status of the submission

- Build 1.0.0 (4) from EAS build `a44d631b` is uploaded to App Store Connect (2026-11-04).
- Through the API: subtitle, description, keywords, promotional text, categories, version `1.0.0`, manual release, age rating, 5 screenshots (6.9 inch).
- Open: privacy policy and support URLs, publish App Privacy, copyright, App Review contact, price and availability, DSA trader status (Chris), TestFlight test on an iPhone, select the build, submit for review.

## 6. Submission runbook

1. Commit the work. Test a Release build on a real iPhone (see "Open").
2. Done: `submit.production.ios` in `eas.json` has `ascAppId` and the API key.
3. Build: `eas build --platform ios --profile production`. EAS manages the distribution certificate and the provisioning profile with the API key.
4. Upload: `eas submit --platform ios --profile production --latest`. Then read the email from Apple for privacy manifest warnings.
5. TestFlight: install the build on the iPhone and do a last check.
6. Screenshots: `scripts/take-screenshots.sh` (builds a Release app with demo data in Berlin, sets a 9:41 status bar, opens each screen with launch arguments, no taps).
7. Metadata and screenshots: `fastlane deliver` with the API key (`brew install fastlane`), from `fastlane/metadata` and `fastlane/screenshots`.
8. Web steps: App Privacy, age rating, DSA trader status, pricing and availability.
9. Select the build, check the review notes, submit for review with manual release.
10. If Apple rejects: read the message, fix, send a new build.
