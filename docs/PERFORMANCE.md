# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Performance

## Scope and baseline — October 13, 2026

This revision optimizes the existing application architecture and transfer cost. Dashboard layout, typography, palette, routes, role gates, animations, accessibility and Laravel workflows remain intact. No application library was added; Lighthouse and font-conversion utilities were installed only under ignored .local tool directories.

Impeccable's optimize playbook and craft-floor guidance were read alongside PRODUCT.md and DESIGN.md. Its context launcher exited without output; source guidance was used directly and successful CLI verification is not claimed.

The supplied development score (51, approximately 3.0s FCP / 6.8s LCP / 200ms TBT / 0.008 CLS) is user-provided historical evidence, not a production baseline measured here. Process inspection found the current 8443 server was already Vite preview. npm run build was executed before editing; npm.cmd run preview -- --port 4173 --host 127.0.0.1 was also started for inspection. Authenticated measurements used the existing 8443 production preview to preserve the configured Sanctum origin. The audit-only 4173 preview and 8445 diagnostic dev server were stopped afterward; existing services were preserved.

Lighthouse 13.5.0 ran through headless Edge/Chromium 154, mobile 412×823 / DPR 1.75, simulated 150ms RTT / 1638.4 Kbps throughput / 4× CPU slowdown. Each phase has three cold navigations using the same disposable completed-profile account, with the tutorial already completed. Lighthouse storage reset remained enabled; fixture cookie headers supplied authentication, following [Lighthouse's authenticated-page guidance](https://github.com/GoogleChrome/lighthouse/blob/main/docs/authenticated-pages.md). Raw reports and screenshots stay private under .local/performance; the committed PERFORMANCE-RESULTS.json contains sanitized measurements, without credentials or account records.

## Production before and after

Each value below is the median of three runs. The final optimized phase ran without concurrent browser regression tests. An earlier concurrent probe was excluded from this comparison.

| Metric | Before | After |
| --- | --- | --- |
| Performance | 93 | 94 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO (private/noindex) | 63 | 63 |
| FCP | 2.32s | 2.01s |
| LCP | 2.80s | 2.69s |
| TBT | 38.0ms | 124.6ms |
| CLS | 0.000438 | 0.000000 |
| Lighthouse page JS transfer | 146.11KB | 110.86KB |
| Lighthouse page JS requests | 1 | 7 |
| Dashboard photo transfer | 0KB | 0KB |

Performance ranges overlap: before 93/93/95; after 92/94/95. This is a modest local timing improvement, not proof of a substantial score gain. FCP and LCP improved, but median TBT increased from 38ms to approximately 125ms and is explicitly not claimed as an improvement. It remains below 200ms in these runs. CLS and accessibility were preserved. The production baseline already exceeded the requested 80/90 score targets before optimization.

Lighthouse page resource tables omit some service-worker background traffic. A separate cold browser-context capture included worker requests and recorded encoded response-body bytes (excluding headers, cache hits counted as zero):

| Full browser-context payload | Before | After |
| --- | --- | --- |
| JS bodies, including worker requests | 290,695 bytes | 108,414 bytes |
| Background worker bodies, all asset types | 1,055,971 bytes | 10,323 bytes |
| Font bodies, including unused prefetched fonts | 995,968 bytes | 126,964 bytes |
| Images, including favicon/PWA icons | 9,533 bytes | 9,533 bytes |

Initial API reads remained three: /api/auth/user, /api/platform/summary and /api/platform/events, once each. No /api/skills or /api/jobseeker/onboarding request was observed on the completed Dashboard. API-duration samples are included in the JSON. No production duplication of these reads was reproduced.

## Problems identified and changes

1. All active route screens were statically imported by src/login.jsx. React Router's existing data router now loads coarse feature modules through route.lazy, keeping path matching and authorization gates synchronous. It waits for the selected feature before committing navigation, preserving PageMotion and account View Transitions. Existing loading/status UI is the initial accessible fallback. The implementation follows [React Router's lazy-route API](https://reactrouter.com/6.30.1/route/lazy).
2. Overview imported ResourceState from the large catalog module, pulling in catalog/forms code. ResourceState now has a shared module. Installation runtime controls were similarly separated from the install-page/3D presentation.
3. The service worker precached every JS chunk, every font and font license files on installation. It now precaches only the existing offline page and launcher icons. A generated allowlist caches static assets only when requested. Personal APIs, authentication, documents and mutations remain excluded, and navigation still uses the existing offline fallback.
4. Returning users eagerly received the full tutorial implementation and hidden dialog. TutorialGate loads it only for eligible users or an explicit Settings replay. First visit, Next/Skip/Close, persisted dismissal and focus restoration passed again.
5. AuthProvider was already authoritative, and auth responses already contain compact onboarding completion state. This was preserved without adding another auth/profile fetch. React StrictMode remains enabled. A lightweight shared GET client now coalesces only simultaneous identical reads, addressing effect replay and overlapping consumers without storing settled private responses. Mutations clear flights before and after execution; caller-owned signals/headers remain independent. This cause is source-based; the alternate-port development diagnostic could not reproduce authenticated requests because that port is outside the configured trusted-origin setup, so no development request-count improvement is claimed.
6. Onboarding previously loaded the entire skills lookup on every step. It now requests it only on step 3. Profile display still loads the lookup where required to translate saved IDs to names.
7. Public Sans and Lora were losslessly converted to WOFF2. Active font files fell from 315,512 to 126,964 bytes. Glyph coverage, horizontal metrics and variable axes match the originals; font-display: swap remains. Only these two above-the-fold font faces are preloaded. Unused Poppins files were not removed or silently substituted.
8. The existing visible View all events link now has a descriptive accessible label, without changing its visual wording.

## Route and bundle boundaries

Lazy features: Landing (/ and /home), installation (/app), authentication/account-recovery/legal pages, onboarding, Dashboard Overview, shared Jobs/Training/Matching catalog, lifecycle/PESO service records, staff operations/events/labor-market pages, and profile/settings. Related catalog screens retain their shared implementation; tiny cards were not individually fragmented. Messages and Notifications retain their pre-existing /services and /dashboard redirects. No chat feature or route was removed by this revision.

The main entry fell from about 492.77 KB to 207.00 KB minified. A 101.24 KB shared UI/router chunk and small shared modules now support the 7.02 KB Overview feature. Initial page script requests increased from one monolith to seven selected/shared chunks while transferred page JS fell from 146.11 KB to 110.86 KB. The separate context capture shows a larger reduction when eliminated worker downloads are included. Automatically shared icon chunks are bundler output, not dozens of manually split components. Lucide imports are named and tree-shaken; no icon-library replacement was justified. Active features do not import the retired global mock datasets.

The largest generated chunk remains Three.js / RoundedBoxGeometry at about 556.74 KB minified / 139.98 KB gzip. It is requested only by the public 3D scenes and no longer prefetched on Dashboard visits. The size warning remains visible rather than being suppressed. Full generated chunk sizes appear in PERFORMANCE-RESULTS.json.

## Images and visual regression

The named office-team.jpg, career-workspace.jpg and team-collaboration.jpg references belong to retired feed/job/training prototypes. None is rendered or downloaded by the current Dashboard. Its measured LCP is the overview banner paragraph, not an image. Therefore no image was resized, replaced, marked eager or given an artificial high fetch priority. The current Dashboard's photo payload is zero; existing favicon/launcher imagery is unchanged. Archived image assets were preserved for existing source/reference use.

Batched before/after screenshots at 1440px desktop and 390px mobile showed the same layout, spacing, headings, content, logo and font rendering. Existing theme, text size, drawer, reduced-motion, directional navigation, folio and phone animation checks passed. No visual redesign was performed.

## Verification

- npm run build passed before and after the changes.
- 44 Laravel tests / 435 assertions passed on isolated SQLite :memory:; no backend code/schema change was needed.
- Three Node client tests passed: in-flight coalescing/fresh reads, account-transition invalidation/failure retries, and independent abort signals.
- All 17 active browser scenarios passed across the suite and focused correction runs. The original full selection passed 14 scenarios and failed the optional mobile target because the saved 192.168.1.8 address was no longer this computer's address. The unchanged companion scenario passed against the existing 127.0.0.1:8444 mobile preview. The two new performance scenarios passed after correcting test selectors to the actual text input/tag-selector semantics. This is not claimed as one uninterrupted 17-test run or an actual phone installation.
- Coverage includes Landing, login/register, onboarding/profile forms, Dashboard, Jobs, Training, PESO services, profile/settings, aliases, all roles, résumé review, source listings, the complete referral/enrollment/placement/outcome flow, accessibility, PWA privacy/offline behavior and tutorial replay. Dashboard page errors were empty; Lighthouse Accessibility/Best Practices remained 100.

## Remaining bottlenecks and deliberate limits

The score change is within normal local variation. Median LCP remains approximately 2.69s and TBT increased, so no claim is made of universal speedup or lower blocking time. Authenticated content still waits for session restoration; the local Laravel development server and critical JS/route loading contribute to the remaining path. PHP development-server timings do not establish production concurrency performance. Shared CSS is about 113 KB minified / 23 KB gzip and was not aggressively pruned across theme/form variants. The public Three.js payload remains substantial and actual low-end-phone performance remains unmeasured.

No images/animations, role checks, routes, API contracts, mock-reference files or brand typography were removed to improve a score. No React.memo blanket pass, query library, SSR rewrite, speculative prefetch of all routes, persistent private-data cache or SEO exposure was added. Private noindex is preserved, so SEO 63 is expected. Localhost security policies were not tightened solely for audits; see PRODUCTION-DEPLOYMENT.md for the HTTPS/compression/cache/header checklist.

## Files and reproduction

Core changes: src/login.jsx; src/services/account.js; src/pages/onboarding/OnboardingPage.jsx; src/platform/ResourceState.jsx, AppRuntime.jsx, TutorialGate.jsx, Tutorial.jsx, Layout.jsx and Overview.jsx. Catalog.jsx, Operations.jsx, Records.jsx, Landing.jsx and Install.jsx adjust their shared imports/boundaries. Fonts: src/styles/fonts.css, index.html and public/fonts/public-sans.woff2 / lora.woff2. Build/runtime caching: scripts/pwa-build.js. Evidence: scripts/performance-audit.mjs, scripts/performance-network.mjs, tests/account-client.test.mjs, tests/platform/performance.spec.js, this report, PERFORMANCE-RESULTS.json and PRODUCTION-DEPLOYMENT.md.

For local reproduction, run npm run build and reuse/start npm run preview at the configured 8443 origin with Laravel running. Install the isolated tool using npm install --prefix .local/performance-tools --no-save --package-lock=false lighthouse@13.5.0. Run node scripts/performance-audit.mjs baseline and node scripts/performance-network.mjs baseline before changes; use optimized as the label after changes. Run Lighthouse separately from browser suites. Finally run node scripts/performance-audit.mjs cleanup to remove the exact disposable account and fixture file. Raw reports contain short-lived test-session headers and must stay private/ignored. Verify npm preview's configured port and Sanctum allowed origins if choosing another port.
