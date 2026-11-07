# Local Laragon follow-up — 13 October 2026

Historical snapshot: counts and checks below describe the recorded revision. For current in-system source requests, protected removal, synchronized sessions and charcoal dark mode, see the [November 7 workspace update](WORKSPACE-UPDATE-2026-11-07.md).

Historical report: its vacancy provider was retired on November 6, 2026. See [current PESO vacancy sources](PESO-VACANCY-SOURCES.md); these earlier vacancy totals are not current browse totals.

The user selected **Local Laragon first**. This revision addresses the monochrome theme, appearance preferences, Overview tutorial, recurring PWA update prompt and researched data. Earlier audit measurements remain historical; this follow-up does not authorize public deployment or certify unresolved legal decisions.

## Changes

- HC2 uses black surfaces and white text/borders/icons, with inverted white buttons and grayscale Three.js artwork. Layout, P mark, typography and workflows remain.
- Appearance: Light/Dark, Larger text, Reduce motion, Underline links and Reset appearance preferences. Saved on the device. Reduced motion honors OS preferences and pauses automatic 3D motion. Reset does not erase account information.
- Replay from Settings opens Overview and highlights actual controls. Previous, Next, Skip, X and Finish remain, with native-dialog keyboard containment, Escape dismissal, target scrolling and focus restoration. First-time eligibility remains account-specific; tutorial code loads on demand.
- Regression testing exposed a dismissal-save race: immediate navigation interrupted the extra CSRF bootstrap before the preference PATCH. The small preference write now reuses the existing session CSRF token and uses fetch keepalive, with a normal token refresh/one retry on 419. Server authentication/CSRF validation remains enforced; no offline mutation queue was added.
- PWA release IDs depend on contents rather than build time. “Later” remembers the release across reloads; a different release can still be offered. Reload stays explicit. Worker version messaging includes compatibility for older workers. No auth/API/private documents/mutations are cached.
- Ordinary catalogs and matching omit retained evaluation samples. Existing records/detail links remain; explicit sample browsing is local/testing-only.

## Source-backed records imported into Laragon

| Data | Rows | Evidence and limits |
| --- | ---: | --- |
| Vacancies | 20 | [PhilJobNet](https://philjobnet.gov.ph/job-vacancies/), public titles/employers/locations/requirements reviewed against detail pages; ten new listings posted 13 October. Unknown deadlines, positions and salary periods stay unknown. No partnerships or hiring guarantee invented. |
| Training | 34 | [TESDA catalog](https://e-tesda.gov.ph/course/search.php?perpage=all&search=ID), including 16 additional bookkeeping, drafting, hospitality and job-readiness courses. Earlier check dates remain when not reverified. External enrollment requires TESDA login; no automatic NC certification. |
| Job fairs | 4 | [DOLE XI schedule](https://ro11.dole.gov.ph/job-fair-schedules/), including Maco 27 October and Davao/DICT 13 October. Official indexed table reviewed; direct requests returned 403, recorded in verification method. Past records are completed; unknown opening times stay null. Regional events do not represent exhaustive nationwide coverage. |
| National statistical report | 1 / four indicators | [PSA OpenSTAT](https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__1B__LFS/0021B3FKEI2.px/), August 2026, Philippines, both sexes, age 15+. Official API returned participation 64.016%, employment 94.731%, unemployment 5.269%, underemployment 11.859%. UI rounds to one decimal and marks preliminary. Separate from platform outcomes. |

Snapshots: `backend/database/data/verified-*.json`. Imports are idempotent and preserve original personal/service records. Calendar/report migration is additive. Source links/check dates are visible; availability can change. Attribution does not establish redistribution permission or government adoption.

No fabricated people, messages, referrals, enrollments, placements or employment outcomes were added. Those require actual submissions and authorized staff verification.

Research scripts fetch anonymous public content only, saving evidence in ignored `.local/source-review`:

```powershell
node scripts/research-public-catalog.mjs
node scripts/fetch-job-evidence.mjs
node scripts/review-psa-source.mjs
node scripts/check-public-links.mjs
```

`scripts/curate-verified-catalog.py` asserts reviewed facts against saved evidence; it is not an unattended scraper/importer. Review changes before importing:

```powershell
cd backend
php artisan peso:import-verified-vacancies
php artisan peso:import-verified-training
php artisan peso:import-verified-public-resources
```

62 distinct source URLs checked: **22 reachable, 34 TESDA login redirects, six inconclusive 403 responses, zero observed 404/410**. Official catalog/search/API evidence supports facts; confirm applications/schedules with providers. Restrictions do not prove a source is fake or reachable for every user.

## Local database hardening

`security:provision-local-database --apply` created a fresh password-protected loopback identity with **SELECT, INSERT, UPDATE, DELETE on `peso_employment` only**. Actual grant checks found no global data grants or CREATE/DROP/ALTER/GRANT/FILE/SUPER privileges. Existing accounts/passwords, data and application key were preserved. Encrypted recovery copy of the previous environment file is under ignored `.local/backups`; credentials are never printed.

Current migrations were applied first. **Future migrations require a separate deployment identity.** Do not broaden the running app's privileges or commit decrypted recovery copies. Provisioning refuses production and defaults to a dry run.

Database check: 12 migrations, 33 foreign-key relationships, zero orphans, foreign-key checks enabled; existing 134 accounts and original résumé preserved. Disposable browser fixtures clean up independently.

## Verification

Main changed files: `src/platform/Appearance.jsx`, `motionPreference.js`, `Tutorial.jsx`, `TutorialGate.jsx`, `Overview.jsx`, `Operations.jsx`, `AppRuntime.jsx`, `pwaUpdates.js`, `PathwayScene.jsx`, `PhoneScene.jsx`, `PageMotion.jsx`; `src/main.jsx`, `src/app/motion.js`, `src/services/account.js`, `src/styles/theme.css`, new `monochrome.css`; `scripts/pwa-build.js` and source-review scripts; backend `EmploymentController.php`, `EmploymentMatcher.php`, query middleware, `PublicResource.php`, `ServiceEvent.php`, console imports, `ProvisionLocalDatabase.php`, additive public-resource migration and reviewed data JSON. Updated PHP/browser tests cover the changes. Existing audit files link to this follow-up; historical measurements were not replaced with guessed results.

- Production build passed; two identical consecutive builds generated the same worker release ID.
- Laravel: **64 tests / 795 assertions passed**, isolated SQLite in memory. Includes new source idempotence/provenance/sample-exclusion/unknown-time/edit-restriction checks and existing security/privacy/workflow tests.
- Focused browser checks: **4 passed**, including 320px monochrome preferences and Axe, actual Overview highlights, release-specific dismissal/worker messaging and sourced catalogs/statistics.
- Client request tests: **6 passed**, including immediate CSRF-protected preference submission, keepalive and stale-token refresh, private-read deduplication/invalidation and safe diagnostic handling.
- Full production-preview browser run: **30 passed, two failed (15.5 minutes)**. One failure was a fixture still requesting a sample through the now source-only default training list; it now explicitly requests local samples. The other exposed the real tutorial CSRF/navigation race described above.
- After the final client fix/build, the affected performance/privacy/appearance/PWA/source/PDF/tutorial/staff-sign-in suites were rerun: **12 passed (3.3 minutes)**, including both previously failing cases. Together with the other 20 passing scenarios, all 32 individual scenarios have a passing result; a second full 32-test run was not performed. Desktop/mobile guide screenshots were visually inspected. No new Lighthouse score is claimed.
- Responsive matrices: **312 route/width measurements, zero horizontal overflow** (90 public, 126 jobseeker, 96 staff/partner), at 320/375/390/768/1024/1440px. Tested Axe audits and page-error assertions passed.
- Android companion scenario passed against the existing loopback origin with the PESOAndroid browser user agent; no new LAN server or policy-blocked command was launched. This is browser verification, not a physical-device, APK-signing/store-release or public-deployment certificate.

## Future deployment decisions

Loopback HTTP is intentional. Public HTTPS, Secure production cookies/HSTS, remote database TLS and infrastructure/backup encryption need the actual hosting environment. No public launch clearance is claimed.

Actual operator/DPO, approved retention/minor-user procedures, unknown asset permissions and delivered email recovery require real organizational inputs. Government directories cannot identify this academic application's operator. Draft notices stay honest; no invented identity, affiliation, license or legal approval was added. These matters remain in `PRODUCTION-DEPLOYMENT.md`, `PRIVACY-ACCESSIBILITY-AUDIT.md` and `ASSET-LICENSES.md` for the later deployment scope.
