# Octave Music — Native Android App

A native Android wrapper for **[music.octavestreaming.com](https://music.octavestreaming.com/)** built with **Capacitor JS 8**. Ships with an offline UI shell that mimics the site's branding (logo + dark/purple music-app theme) so the app feels native even when the device has no connection.

## Features

- **Native Android APK** built via GitHub Actions CI on every push.
- **Online mode** — the WebView navigates directly to `https://music.octavestreaming.com/`.
- **Offline mode** — a custom `OfflineFallbackWebViewClient` intercepts main-frame network errors (or HTTP 5xx) and loads the bundled offline UI at `https://localhost/?offline=1`. The offline UI looks like a music streaming app: header with the Octave logo, greeting, quick-pick tiles, "Made for you" carousel, "Recently played" list, bottom nav, mini-player, and a "You're offline" overlay with a Retry button.
- **Auto-retry** — when the device reconnects, the app automatically re-navigates to the live site.
- **App icon & splash screen** generated from the site's own favicon/logo.

## Architecture

```
src/                     # Web assets (offline UI shell)
├─ index.html            # App shell with offline UI
├─ styles.css            # Dark music-app theme
├─ app.js                # Network detection + live URL navigation
└─ icon.png              # Octave logo (from site favicon)

scripts/
└─ patch-android-offline.js   # CI step: injects OfflineFallbackWebViewClient
                                into the native Android project after `cap sync`

.github/workflows/
└─ build-android.yml     # Builds debug APK on push, release APK on tags

capacitor.config.ts      # Capacitor 8 config (appId: com.octavestreaming.music)
```

### Offline detection flow

1. App boots → loads `https://localhost/index.html` (local).
2. `app.js` checks network status via `@capacitor/network`.
3. If **online** → `window.location.replace('https://music.octavestreaming.com/')`.
4. If **offline** → stays on the local shell, shows the offline overlay.
5. If the live URL fails to load (offline, 5xx, Cloudflare block) → the native `OfflineFallbackWebViewClient.onReceivedError` fires → loads `https://localhost/?offline=1`.
6. `app.js` sees the `?offline=1` flag → shows the offline UI immediately, no retry loop.
7. When the device reconnects (`networkStatusChange` event), the app re-navigates to the live URL.

## Local development

```bash
npm install
npm run build           # copies src/ -> www/ and icon
npx cap add android     # first time only
npx cap sync android
npx cap open android    # opens Android Studio
```

Build the APK from Android Studio, or via Gradle:

```bash
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## CI builds

The GitHub Actions workflow at `.github/workflows/build-android.yml`:

- Triggers on every push to `main`, every PR, every tag `v*`, and via manual `workflow_dispatch`.
- Sets up Node 20, JDK 21, Android SDK 35.
- Installs deps, builds web assets, generates icons & splash via `@capacitor/assets`, adds the Android platform if missing, syncs Capacitor, runs the offline-fallback patch, then builds the APK.
- Uploads the APK as a workflow artifact (`octave-music-debug` for debug, `octave-music-release` for tags).

Download the APK from **Actions tab → select the latest run → Artifacts**.

## Install the APK

```bash
adb install app-debug.apk
```

Or transfer the APK to your phone and tap to install (enable "Install from unknown sources" first).

## Configuration

Edit `capacitor.config.ts` to change:
- `appId` — Android application ID (currently `com.octavestreaming.music`)
- `appName` — Display name (currently `Octave Music`)
- `LIVE_URL` in `src/app.js` — the target site URL

## Security note

The GitHub PAT used to push this repo should be **rotated after the initial push** because it was shared in plaintext. Future pushes should use a fresh PAT stored as a repository secret.
