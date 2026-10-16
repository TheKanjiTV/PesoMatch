# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Jobseeker Registration & Profiling

## Required sections

1. Personal information and contact/location.
2. Highest educational attainment and school/program.
3. Declared skills; optional certifications, licenses and languages.
4. Work experience or explicit no-experience selection.
5. Preferred occupations, industry, location, employment types and work arrangements.

Existing Laravel validation and saved-step progression are preserved. Public registration always creates a jobseeker; accounts are not automatically logged in after registration. After login, an incomplete profile resumes its first unfinished section.

Completed users can review/edit sections from /profile. Profile editing persists through the existing APIs. Optional qualifications do not block completion. The new global type/color system applies to onboarding; the existing form validation and unsaved-change protection remain.

PESO officers view relevant saved profiles through the registry. Partner accounts bypass jobseeker onboarding after an administrator provisions their role. Account changes require the current password. Password recovery/email verification delivery remain unconfigured and are identified in the account screens.
