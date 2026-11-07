# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Jobseeker Registration & Profiling

## Current selection and session behavior

Dropdown prompts are disabled/hidden and cannot become a saved selection. Required native selection and server validation remain. Same-origin tabs restore the same server account and profiling progress; stale-tab identity changes are rejected before private actions and refreshed. See [November 7 session update](WORKSPACE-UPDATE-2026-11-07.md).

## Required sections

1. Personal information and contact/location.
2. Highest educational attainment and school/program.
3. Declared skills; optional certifications, licenses and languages.
4. Work experience or explicit no-experience selection.
5. Preferred occupations, industry, location, employment types and work arrangements.

Existing Laravel validation and saved-step progression are preserved. Public registration always creates a jobseeker; accounts are not automatically logged in after registration. After login, an incomplete profile resumes its first unfinished section.

Completed users can review/edit sections from /profile. Profile editing persists through the existing APIs. Optional qualifications do not block completion. The new global type/color system applies to onboarding; the existing form validation and unsaved-change protection remain.

PESO officers view relevant saved profiles through the registry. Partner accounts bypass jobseeker onboarding after an administrator provisions their role. Account changes require the current password. Password recovery/email verification delivery remain unconfigured and are identified in the account screens.


After profile completion, the first-visit guide visits the actual role-authorized workspace modules. It is not limited to Overview. The jobseeker route includes Profile, Vacancies, Matching, Referrals, Training, Enrollment and the remaining service pages. Next waits for the destination to load; Previous, browser Back, Skip and Close remain available, and Settings/Overview replay starts the whole guide again. Completion/dismissal uses the existing server preference and per-user session dismissal. No service records are submitted by the guide.
