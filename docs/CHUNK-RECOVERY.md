# Stale Login chunk recovery — 13 October 2026

## Cause and immediate recovery

The open in-app browser requested `/assets/AuthPages-BNC0sYh1.js` after later production builds had replaced `dist`. The file was gone. Vite preview's SPA fallback returned **200 HTML** for the missing script, causing dynamic import failure. Laravel `/up` and frontend `/login` returned 200; this was an asset rollout failure, not evidence of invalid credentials or lost data.

The affected tab was inspected and reloaded once while it displayed the error. The actual Login form returned with title “Log In | PESO Employment Services.” No cookies, account data or credentials were cleared. Already-loaded old application code cannot gain new error handling until it reloads.

## Fix

- `vite.config.js`: `build.emptyOutDir: false` preserves earlier content-hashed assets for open local preview/PWA tabs. New and old entries can use their corresponding chunks.
- `scripts/pwa-build.js`: current `writeBundle` outputs determine the asset allowlist/hash. Retained prior files do not change the current release ID or become current worker assets. API/auth/private documents/mutations remain excluded.
- `scripts/security-headers.js`: missing assets return **404 text/plain, no-store**, instead of HTML. Hashed assets use immutable caching; HTML, worker and manifest revalidate. Preview CSP uses the current index so its inline-script hash stays aligned after rebuild. Existing security headers and API proxy remain.
- `src/platform/RouteError.jsx`: the existing static boundary recognizes module failures and explains safe explicit retry/reload. No developer stack or automatic reload of unsaved work.

The existing preview process was restarted to load new middleware/configuration, still bound to `127.0.0.1:8443`. Laravel/MySQL/data were preserved. No dependencies added; code splitting/layout retained.

## Verification

`tests/platform/chunk-recovery.spec.js` requires production preview and rebuilds local `dist` sequentially; do not run it concurrently with another build/test.

Three scenarios passed (45.7 seconds):

1. Open the original landing without loading AuthPages, rebuild, then Sign in. The entry actually changed from `/assets/index-7aJVCkY3.js` to `/assets/index-BAvQIs-Y.js`. Original `/assets/AuthPages-DwgAlj4I.js` and its entry remained reachable as JavaScript. Old tab loaded Login without page errors. A second identical build retained a disposable prior-release file, excluded it from the worker and preserved the release ID. Evidence: `artifacts/chunk-recovery/build-retention.json`.
2. Abort the current AuthPages module: branded recovery appears with zero tested Axe WCAG 2/2.1/2.2 A/AA violations. Remove the failure and Retry: Login loads. Screenshot: `artifacts/chunk-recovery/login-recovered.png`.
3. Obsolete script/missing stylesheet are uncached 404s with nosniff; entry/worker/manifest revalidate; Login/Register/staff Login work at 375px without page errors.

Six focused existing regression scenarios passed (1.5 minutes): real jobseeker/partner Login, authoritative initial Dashboard auth read and deferred feature loading, skills lookup only on the editing step, PWA offline/private-cache protection, release-specific update dismissal and controlled network/form/chunk retry. The original in-app browser still displayed the functional Login form after the rebuild. No new Lighthouse score or full security certification is inferred.

## Asset retention and deployment

Retention increases local `dist` disk usage across revisions, without making fresh Dashboard visits download old chunks. Do not clean the active preview output while tabs still use it. For public releases, stage a fresh reviewed artifact separately, deploy atomically, retain earlier hashed assets for the rollout period and return asset 404s before SPA fallback. Expire files through the reviewed release process. `emptyOutDir: false` is not permission to ship unreviewed leftovers or a substitute for the production asset/license checklist.
