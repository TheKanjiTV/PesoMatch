# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Mobile Application

## Delivered application paths

| Delivery | Included behavior |
| --- | --- |
| PWA | Standalone manifest, authored launcher icons, install prompt when supported, browser-specific install guidance, update notice and safe offline fallback |
| Android companion | Native platform-address setup, dedicated WebView, persistent first-party session, Android Back navigation, mobile role workspace CSV export and private résumé PDF upload/download through Android's file picker |
| Mobile browser | Same complete role-based system, HC1/HC2, larger text, bottom navigation and full service drawer |

The companion uses the actual hosted web interface and Laravel backend; it is not an independently reimplemented/offline database. Sign-in, profiling, vacancies, matching, referrals, enrollment, placement, monitoring and PESO operations retain the same server permissions. The app does not grant extra roles.

## Try the Android development APK on the same Wi-Fi

From the repository root:

```powershell
pnpm build
pnpm mobile:preview
```

The helper prints the computer's private address on port 8444, for example `http://192.168.1.8:8444`. On a phone connected to the same Wi-Fi, open that address followed by `/app`, then download the Android APK. Install the local development APK and enter the printed platform address at first launch. Use your own existing account. No demo credentials are shipped.

The helper starts an isolated Laravel process at 127.0.0.1:8002 and a LAN Vite preview at port 8444. It passes the corresponding Sanctum stateful domain and proxy settings through process environment variables. It preserves the existing .env, database and 8000/8443 local services. Ctrl+C stops the mobile preview. The local address may change when the computer reconnects to Wi-Fi. Windows firewall and guest-network isolation can affect phone access; no firewall rules are changed by this helper.

The local APK permits HTTP only for private development addresses. Release builds accept HTTPS origins. 127.0.0.1 on a phone means the phone itself; use the printed computer address. Public PWA installation on phones requires a secure HTTPS deployment, so the HTTP LAN preview is intended for the Android development APK and mobile browser checks.

## Build the Android APK

```powershell
pnpm android:build
```

This runs Gradle `assembleDebug`, `testDebugUnitTest` and `lintDebug`, copies the APK to `public/downloads/peso-android-local.apk`, and updates `public/app-release.json` with its SHA-256. If `dist/` exists, the APK and metadata are also copied there. Build artifacts, SDKs and downloaded tooling are Git-ignored.

The build helper uses the portable JDK/SDK under `.local/android-tools/` on this machine. On a different Windows machine, install JDK 17 or newer and Android SDK platform 35 / build-tools 35.0.0, then pass their directories:

```powershell
& .\android\build-local.ps1 -JavaPath 'C:\path\to\jdk' -SdkPath 'C:\path\to\Android\Sdk'
```

The Gradle wrapper is included. Android minimum API is 26 (Android 8), compile/target API is 35. The delivered build uses the debug application ID `ph.peso.employment.local` and debug signing. It is not a Play Store release. Existing device installations with a differently signed build may need removal before this local build can be installed.

## PWA installation

Open `/app` from the deployed HTTPS platform. On Android or desktop Chrome/Edge, use Install PESO app when offered or the browser install menu. On iPhone/iPad Safari, use Share → Add to Home Screen. Installation options depend on browser/device support. No iOS IPA is built on this Windows host.

The service worker precaches only static assets and the offline information page. It does not cache `/api/`, `/sanctum/`, personal records or submissions. Offline navigation shows a connection/retry page; no mutation is queued. An update waits for the user's Reload app action so it does not interrupt an unsaved form.

## Native behavior and boundaries

The platform address must be an origin without credentials, page paths, queries or fragments. External HTTPS/email/telephone links open their system handler. Unsupported schemes remain blocked; SSL errors are not bypassed. Direct WebView filesystem access and third-party cookies are disabled. Content access supports the system-selected PDF URI; no broad storage permission is requested. The trusted platform can open Android’s PDF picker, and a download handler fetches only the authenticated same-origin résumé endpoint (maximum 5 MB, redirects refused) into a user-selected PDF destination. Cloud backup and device transfer of application data are excluded. The CSV bridge accepts bounded CSV text and a constrained filename, requires the current trusted platform and opens Android's user-selected file destination. It exposes no filesystem reads or general command execution.

All service functions need the platform server. Actual phone performance, camera features and physical-device file picker behavior, notifications, official agency connections and app-store review are not claimed. This revision checks the Android build, unit tests, lint and a mobile-browser session using the Android companion user agent; a physical-device installation is still a separate acceptance check.

## Public release preparation

Deploy the frontend and Laravel API behind one HTTPS origin, keeping `/api` and `/sanctum` routed to Laravel. Configure that frontend origin in Sanctum and use secure first-party cookies. Build a signed release with the owner's signing key, remove debug-only HTTP access and verify the full flow on actual supported phones before distribution. No signing credentials, external hosting or public publishing are created by this revision.

Reference: [MDN PWA installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Android WebView](https://developer.android.com/develop/ui/views/layout/webapps/webview), [Android app signing](https://developer.android.com/studio/publish/app-signing).
