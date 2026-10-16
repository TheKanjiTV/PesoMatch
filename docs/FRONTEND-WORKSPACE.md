# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Connected Workspace

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
