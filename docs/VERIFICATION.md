# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Verification

## Current revision — October 10, 2026

The active system uses React JSX, Vite/Tailwind, Laravel/Sanctum and Laragon MySQL. This report supersedes earlier notes about the retired feed prototype, building diorama, tall HTML phone and manual stage buttons. Active browser tests are in tests/platform/.

## Automated results

| Check | Result |
| --- | --- |
| pnpm build | Passed after the final source-detail copy changes |
| php artisan test | 44 passed, 435 assertions; isolated SQLite :memory: |
| Browser scenarios | All 15 passed across the full suite and focused correction runs |
| HC1/HC2 and larger text | Public/account pages, 13 jobseeker screens, five profile forms, persistence, 320px mobile navigation and Axe A/AA passed |
| PESO workflow | Persisted referral, service, enrollment, review, offer, placement, provider completion, employment report and verification passed |
| Role access | Jobseeker, employer, provider, PESO officer and administrator route/ownership boundaries passed |
| Résumé PDF | Real extraction, review/apply/reload, private download/delete, ownership, validation, negated skills and additive matching improvement passed |
| Tutorial and motion | First visit, replay, Next, Skip, Close, focus restoration, animated mobile Services drawer and page navigation passed |
| Official training | 18 idempotent courses, source evidence, external enrollment and vacancy-specific skill gaps passed |
| Official vacancies | 10 idempotent listings, honest unknown metadata, external referral rejection, recency/closure filtering, bookmarks and mobile detail accessibility passed |
| PWA | Manifest/icons, safe offline fallback and exclusion of personal API/auth caches passed |
| Android LAN | Real login/CSRF, companion identity, training navigation and sign-out passed against the Wi-Fi preview |
| Android 1.2.0-local | assembleDebug, 11 address-validation unit tests and lintDebug passed; zero lint errors |

The full 15-scenario Edge run passed 14 tests and exposed a wrong URL in the newly added source-listing test: /vacancies/:id instead of the UI route /jobs/:id. The corrected source test and HC2 route scenario then passed together (2 tests, 52.7 seconds). The source scenario passed again after the final detail-copy build (1 test, 14.6 seconds). These results are not presented as one uninterrupted 15-test pass. The full run included PESO_MOBILE_ORIGIN=http://192.168.1.8:8444, exercising the optional LAN scenario.

Browser tests use the built frontend on 127.0.0.1:8443 and the actual Laravel/MySQL service. Disposable example.test accounts and their exact own records are cleaned up. PHPUnit forces SQLite :memory: and never refreshes the live database.

## Visual and interaction review

Impeccable's local source guidance, animation reference and craft floor informed the changes. Its context launcher failed without usable output; successful CLI verification is not claimed. The restored quiet civic workspace, solid light/dark surfaces, plain P mark and top-bar identity remain. Theme uses a sun/moon button; larger text is an on/off setting only in Account Settings.

The larger career folio sits directly on the background without a frame, captions or stage tabs. Pause/play and reset remain. The /app scene contains a compact genuine Three.js phone with authored movement and no floating scene text or extra animated objects. Routes and the mobile drawer honor reduced motion. Scenes suspend offscreen/hidden and dispose their resources.

Batched desktop/mobile screenshots were inspected for the landing, installation page, dashboard, résumé review, tutorial and staff sign-in. A focused source-vacancy mobile review confirmed readable provenance, unknown metadata, the official application action and saved state. Artifacts are under artifacts/experience/ and artifacts/revisions/. Covered screens pass overflow and Axe checks; wide tables scroll locally. Full-page captures place fixed bottom navigation at its viewport position; real content scrolls with bottom clearance.

The lazy Three.js shared chunk is about 557 KB minified / 140 KB gzip. Vite reports a chunk-size warning; the build succeeds. The workspace does not instantiate public scenes. Actual low-end phone performance has not been benchmarked.

## Laragon and source integrity

All nine migrations are applied to MySQL database peso_employment. The original SQLite database, consistent private snapshot and environment were preserved. Before switching, the transfer compared canonical source rows, including all 134 existing users, password hashes, roles, profiles, sessions and workflow records. A final read-only check found 134 users, 10 source-listed vacancies, 18 official courses, four labeled sample vacancies and three labeled local sample programs. All 32 foreign-key relationships were checked: zero orphan references, foreign-key checks enabled.

Source records have official URLs and checked timestamps. External jobs expire from browse/matching after 30 days without a researched refresh, or earlier when a known deadline passes. Availability still requires source confirmation. Unknown deadline, positions and pay period stay unknown. Source jobs do not create partner relationships or local referrals. TESDA enrollment opens on TESDA. No users, learner progress, referrals, placements, outcomes or government certifications were fabricated. See DATA-SOURCES.md for the 28-record evidence table.

## App artifact and remaining boundaries

The APK package is ph.peso.employment.local, versionCode 2, versionName 1.2.0-local, read from the actual APK. Its SHA-256 matches public/app-release.json:

    0400060f52b4420e3d3187e4b1d3a1c2b12476011c96ef5c82f443311ffc7a7c

The Android companion includes a system PDF picker and authenticated same-origin résumé saving. Build/unit/lint and companion-identity browser checks passed; physical-device installation/file-picker acceptance remains required. It is debug-signed, not a store release. iPhone installation uses the HTTPS PWA; no native iOS IPA is produced. See MOBILE-APP.md.

Résumé analysis extracts selectable PDF text and skill evidence locally; OCR and an external LLM are not configured. Education/work excerpts remain user-reviewed. Matching uses saved reviewed skills and remains advisory, requiring pilot effectiveness evaluation. Agency feeds, mail delivery, production hosting and government adoption are not claimed.

Documents use the existing Markdown format and new title/modules. The faculty manuscript/chapter template was not supplied, so exact academic-template compliance is not claimed. A pilot office still supplies operational eligibility, privacy/retention and reporting rules.
