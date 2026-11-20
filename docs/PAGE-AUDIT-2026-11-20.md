# Training Demand fix and workspace audit

20 November 2026. Training Demand crashed because `TrainingParticipation.jsx` rendered React Router `Link` components without importing `Link`. This was a browser `ReferenceError`, not a connection outage. The missing import was fixed and published through the domain Git release at implementation revision `7a29d19a8a2d2e5e4725ddc84bee5a49c3b02170`.

## Completed checks

| Authenticated local test role | Desktop/mobile page checks | Result |
| --- | ---: | --- |
| Jobseeker | 30 | Passed |
| PESO staff | 26 | Passed |
| Administrator | 30 | Passed |
| Employer | 16 | Passed |
| Training provider | 14 | Passed |
| Total | 116 | No JavaScript crashes, failed API responses, stuck busy states or horizontal page overflow in these cases |

These cover all 18 current workspace pages according to role permissions: dashboard, vacancies, training catalog, Training Demand, AI Career Workspace, Job Matching, referrals, enrollments, placements, outcomes, PESO services, events/programs, labor-market information, profile, settings, jobseeker registry, account access and audit. Test accounts were disposable and cleaned up; this does not claim that every possible data combination or external model response is validated.

The actual local Training Demand workflow passed: create a topic, reload and retain it, verify that no enrollment was created, switch to PESO staff and open a separate draft training intake with that topic. The prior browser list omitted the two new workspace pages, so a complete role inventory and a router-declaration coverage check were added.

Backend suite: **121 passed / 6,071 assertions**, with the two opt-in live-model tests skipped. No model changes were made for this fix. Build and new undefined-reference lint passed locally and on Hostinger. The lint scans all 152 source files with the two targeted undefined-variable/JSX rules; a saved pre-fix source probe produced the original missing-`Link` errors, while the corrected source passed. This is not a claim of a comprehensive lint/quality assessment.

The actual deployed HTTPS lazy bundle was also opened for jobseeker, PESO staff and admin with **isolated synthetic API responses**. All three displayed Training Demand and its links without browser errors. This verifies the published frontend, not a real applicant production login. Local authenticated page checks above used the actual Laravel API. Existing application key, private files and protected database records were preserved by the release checks.

## Regression suite

The initial broader browser run completed with **67 passed, 16 failed and one optional LAN case skipped**. Every one of those 16 failing cases subsequently passed in targeted reruns after application fixes and updates to stale fixtures/selectors. The entire broad suite was not rerun as one final batch. Logs retain both the initial failures and their follow-up results.

Four additional application defects were repaired:

- Official vacancy/training source coverage was outside the native detail dialog and could not be operated while the dialog was open. It now appears inside that dialog, together with save feedback.
- Required-field blur validation could insert an error during a mobile Cancel click, move the button between mouse-down and mouse-up, and prevent dismissal. Explicit dialog-dismiss controls now skip blur validation; submit validation is retained. The 320px incomplete-account privacy/deletion case and keyboard validation case passed afterward.
- Automatic AI privacy notices could cover the active workspace tutorial. They now wait for existing dialogs to close. A dedicated test verifies that consent remains unchecked and no AI POST is made when continuing without AI.
- Tutorial focus restoration could run before the new Overview controls mounted. The persistent tutorial gate now restores focus after the destination and its data are ready. The complete 13-step jobseeker replay passed, including its final focus assertion.

The follow-up batches recorded **16/21, 3/5, 5/6 and finally 8/8 passing cases** as remaining failures were investigated and corrected. These are overlapping diagnostic batches, not totals of unique tests or an accuracy measurement. The final 8/8 batch covered tutorial restoration, staff creation/enrollment dialogs, vacancy/referral/enrollment details and status forms, account/event/outcome dialogs, AI unavailable and consent states, interview modal layout, duplicate-referral feedback, and deferred privacy notices.

The real local end-to-end request/referral, enrollment confirmation/progress/completion, PESO placement verification and employment-outcome verification passed using disposable, owned catalog fixtures. Cleanup is limited to those exact labeled records and local/testing environments. Expired samples and assumptions about first-page catalog order were removed from these tests. Other corrected expectations reflect the existing charcoal theme, 13-step guide, current labels and authenticated sign-in redirects; these did not require changing working application behavior.

The initial passing cases also exercised public/authentication pages, release/chunk recovery, PWA behavior, résumé/profile persistence, role restrictions and six responsive viewport widths. AI browser scenarios use mocked provider responses and do **not** establish live-model or independent PESO evaluation results.

## Prevention

`pnpm build` now runs `pnpm lint` first. Oxlint 1.94.0 is pinned as a development dependency with browser globals and checks for undefined variables/components. Routine authenticated tests explicitly continue without external AI when its privacy notice opens; dedicated consent tests retain manual control of that notice. No default consent is enabled in the application.

Private verification artifacts are under `artifacts/page-inventory/`; logs are in ignored `.local/page-audit-*.log`. Refresh or use **Retry page** in an already-open failed tab to load the published fix.
