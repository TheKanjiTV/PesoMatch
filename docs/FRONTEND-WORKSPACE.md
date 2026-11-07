# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Connected Workspace

## Session synchronization and current interactions

Same-origin tabs share the Laravel cookie session. Authenticated `/` and sign-in visits restore the role workspace; Public home remains available at `/?public=1`. BroadcastChannel/storage change notices and focus/visibility rechecks fetch the authoritative account. Identity/role changes reset private page state. A stale tab identity returns `409 SESSION_CHANGED` before acting; tutorial replay only updates the signed-in user's preference.

Source details submit local PESO referral/enrollment requests and open their tracking pages. Destructive controls use a named, keyboard-accessible native modal with a five-second server-enforced wait. Dropdown prompts are hidden/disabled; “All” remains a functional filter. Source review notes, internal intake verification and actual admission are distinct. See [November 7 update](WORKSPACE-UPDATE-2026-11-07.md).

## Routes

| Route | Purpose |
| --- | --- |
| /dashboard | Role-specific overview and service tasks |
| /jobs, /jobs/:id | Vacancy catalog/details and authorized management |
| /matches | Explained vacancy matches and skills-development recommendations |
| /training, /training/:id | Training catalog/details and provider/PESO management |
| /referrals | PESO review, interviews, offers, withdrawal and placement verification |
| /enrollments | Provider review, progress, completion and withdrawal |
| /placements | Verified employment records |
| /outcomes | Employment reports and PESO verification |
| /services | PESO support cases |
| /events | Job fairs, orientations and employment programs |
| /labor-market | Platform-scoped vacancy and outcome reporting |
| /jobseekers | PESO/admin registry |
| /users, /audit | Administrator access management and audit |
| /profile, /settings | Own profile and account/security settings |

## Continuous journey

Register and complete the saved profile. Review vacancies/matches, request PESO referral, optionally enroll in relevant training, follow interview/offer progress, review verified placement, and report employment changes. Training is not an obligatory gate before a referral.

## Data boundaries

Active pages are in src/platform/. api.js uses the same CSRF/session client as account services. New workflows use Laravel records. Earlier src/pages/jobseeker and src/pages/staff demo workspaces are no longer registered in the router. Their source remains for reference; their local browser state is not imported into the database.

## Motion and accessibility

Stable service navigation, responsive lists, inline editors, native forms, reduced motion and explicit loading/error/retry states. Wide data tables scroll inside their containers.

## Service navigation

Role-scoped sidebar replaces the earlier social toolbar and chat/notification docks. Former /staff and /businesses links resolve to the authenticated role destination. Former assistance/profile/settings links redirect to current service routes.

## Skill analysis and Training extension

/matches derives suggestions from the actual profile. Training programs list their own requirements, skills, capacity, fee and schedule. Enrollment requests persist and require authorized confirmation.


## Full workspace guide and sidebar skeletons

The sidebar/mobile navigation now shares private page loading through `WorkspaceLoadingProvider`; anonymous shell placeholders cover initial session restoration. The first-visit/replay guide persists while changing real routes, waits for loading to finish, and highlights each authorized page. Jobseekers visit Overview, Profile, Vacancies, Matching, Referrals, Training, Enrollment, Placements, Outcomes, Services, Events, Labor Market and Settings. PESO/admin include registry and their permitted administration pages; partner roles omit restricted modules. Previous/browser Back, Skip/Close and replay remain supported; Finish returns to Overview. Only the existing tour preference is written.

Training Enrollment presents withdrawal as the single cancellation action; the duplicate delete button/dialog is removed from this page.
