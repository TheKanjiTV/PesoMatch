# PESO Employment Facilitation Platform

React JSX + Vite + Tailwind CSS frontend; Laravel 12 PHP + Sanctum backend. Formal title: AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO).

## Development

Local production preview serves live `dist`: preserve prior content-hashed assets for open tabs (`build.emptyOutDir: false`), use current bundle outputs for PWA release hashing, and return 404 for missing assets before SPA fallback. `tests/platform/chunk-recovery.spec.js` rebuilds sequentially and requires production preview; never run another build alongside it. Do not clean an output directory currently serving users. See docs/CHUNK-RECOVERY.md.

Use pnpm install --frozen-lockfile, then pnpm dev. Check existing listeners before starting another process. Frontend: http://127.0.0.1:8443. Laravel API: 127.0.0.1:8017. Keep cookie hostname consistent.

## Structure

- src/login.jsx: active public/account/onboarding and role-scoped platform router.
- src/platform/: replacement public portal, sidebar and persistent employment service screens.
- src/app/auth/: existing real Laravel account flows with the new visual identity.
- src/pages/onboarding/: validated persisted five-step profiling.
- src/services/account.js: shared CSRF/session API client.
- backend/app/Http/Controllers/EmploymentController.php: authorized catalog and domain workflow API.
- backend/app/Services/EmploymentMatcher.php: local count-vector cosine relevance; consented semantic scoring is in SemanticMatcher.
- docs/: current requirements, design, API, responsibilities, implementation-aligned documentation and verification.

## Checks and constraints

Run pnpm build, pnpm test and backend/php artisan test as appropriate. Active browser tests are in tests/platform/. Older tests in tests/ target the retired feed prototype and are historical references. Keep components JSX and use Tailwind utilities. Preserve existing account/onboarding validation, jobseeker-only public registration, labeled sample records and the sibling impeccable folder. Never claim an external AI model, TESDA/PEIS integration or government adoption without evidence.

## Employment workspace

The October 10 user request explicitly authorizes real vacancy, referral, training enrollment, placement, outcome monitoring, PESO service and role-management backend scope. New active workflows use Laravel, not demo localStorage. Partner ownership and role restrictions must be enforced on the server. PESO verifies placement/outcomes; providers confirm enrollment; employers decide hiring. AI recommendations remain advisory. Vacancy Management contains matching percentages; do not restore separate Job Matching, Employment Outcomes or Labor Market Information navigation. Interview outcomes are optional within a referral and only PESO staff/admin may enable them after the interview. Tutorial replay is admin-only; first-time users still receive the guide.

The new visual authority is docs/DESIGN.md and PRODUCT.md. The earlier blue social toolbar/feed reference is retired. Follow the user-authorized replacement direction. Impeccable source guidance was read; its launcher/context/concept-seed exited 1 without output, so no CLI verification is claimed.

## Readability and applications

HC1/HC2 and larger text are controlled by src/platform/Appearance.jsx and semantic tokens in src/styles/theme.css. Keep solid surfaces and strong body contrast in the user-restored quiet civic dashboard. Theme switching uses a sun/moon icon; larger text is an on/off switch only in Account Settings. The name/role belongs in the top bar, not the sidebar. Preserve the plain open P logo. The Three.js pathway is lazily imported only on the landing and must support pause, offscreen/hidden suspension, reduced motion and a fallback. Account navigation uses directional View Transitions.

The mobile workspace uses bottom navigation and a service drawer; keep drawer actions above the fixed bottom bar. PWA cache generation lives in scripts/pwa-build.js and must never cache personal API/auth responses or queue mutations. Android is a same-origin WebView companion under android/, with a debug APK built by pnpm android:build. pnpm mobile:preview starts the separate LAN preview on 8444/API 8002 without editing .env. Test the optional LAN scenario with PESO_MOBILE_ORIGIN. See docs/MOBILE-APP.md; do not describe a debug build or browser emulation as a verified physical-device/store release.

## Backend checks

November 7 local follow-up: HC2 uses layered charcoal surfaces, white headings and subdued readable action colors; the earlier black/white palette is retired. Appearance includes Reduce motion and Underline links. Respect OS/device motion preferences in CSS and Three.js. Tutorial replay visits real role-authorized workspace pages and waits for their data; it must not submit service records or change an account role. Sidebar, mobile navigation and the complete identity/action header use skeletons only during initial workspace/session loading. Once ready, navigation stays usable during page changes, searches and retries; only pending content uses its matching skeleton. Reset shell readiness when the authenticated identity/role changes. Training Enrollment uses Withdraw request without a duplicate delete button. PWA version IDs must be content-stable and dismissal release-specific. Public source catalogs omit samples by default; do not invent people or outcomes. Reviewed source imports and limits are in docs/LOCAL-REFINEMENTS.md. The local MySQL app identity now has CRUD only; future migrations require a separate deployment identity. Preserve the application key and encrypted recovery copy.

PHPUnit must use SQLite :memory: so RefreshDatabase never touches the account database. Do not run migrate:fresh against development data. Use additive migrations and preserve .env/application key. No default privileged credentials. Use peso:access on an existing local account to provision initial access.
