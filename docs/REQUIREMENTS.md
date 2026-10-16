# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Requirements

## Current authority

The October 10 brief expands PesoMatch from job matching into end-to-end PESO employment facilitation with upskilling and employment monitoring. The formal title above replaces the previous Employment Assistance wording. The whole active interface uses a new civic service design. The original academic manuscript and faculty format were not supplied; this document preserves the existing Markdown structure.

## Users and decision boundaries

Public registration: jobseeker only. PESO officers administer services. Administrators provision roles and review audits. Employers manage only their vacancies and referred applicants. Training providers manage only their programs and enrolled learners. Every privilege is enforced in Laravel. PESO verifies placements/outcomes; employers decide hiring; providers confirm enrollment.

## Functional requirements

| Module | Implemented behavior | Evidence / boundary |
| --- | --- | --- |
| Jobseeker Registration & Profiling | Registration, login, five-section profile, saved progress, editing | Existing account/onboarding controllers and tests preserved |
| Vacancy Management | Create/update, review publication, dates, skills, positions, salary | Partner ownership, validation, audit; no remote vacancy feed |
| Job Matching & Referral | Profile-based recommendations, explained gaps, referral requests, employer updates | TF-IDF baseline; no automatic rejection |
| Training & Skills Development Recommendation | Recommend published programs addressing vacancy skill gaps | Uses declared skill evidence and current catalog |
| Training Enrollment | Request/consent, confirm capacity, progress, completion reference, withdrawal | Provider or PESO confirmation; no official TESDA integration |
| Employment Facilitation & Placement | Referral, interview, offer, verified start, follow-up schedule | Only PESO records verified placement |
| Labor Market Information | Real vacancy demand/skills, CSV, staff outcome aggregates | Samples excluded from vacancy demand; platform scope only |
| Monitoring of Jobseeker Employment Outcomes | Status reports, verification, placement linkage, due follow-up | Own reports scoped; latest report per jobseeker |
| PESO responsibilities | Counseling, assessments, orientation, livelihood/reintegration, program/event coordination | Service case records support PESO officers; statutory decisions remain human |

## Course software and tools

| Tool | Implemented role |
| --- | --- |
| PHP / Composer / Laravel 12 / Sanctum | Validation, cookie sessions, authorization, business transitions, database |
| React JSX / Vite / Tailwind CSS v4 | Responsive public portal and role-specific service workspace |
| Laragon MySQL | Active persistent database (`peso_employment`); SQLite :memory: for isolated PHPUnit |
| Playwright / Edge / Axe | Workflow, route, responsive and accessibility verification |
| PHPUnit | Account, onboarding, permission, ownership and workflow regression checks |
| Git | Source versioning; existing user changes preserved |
| Impeccable source skill | Design guidance; launcher unavailable on this machine |

## Laravel data/API boundary

Entities: users, profile and related education/skills/preferences; vacancies; training_programs; enrollments; referrals; placements; employment_outcomes; service_requests; service_events; saved_vacancies; audit_events. Foreign keys and ownership constrain records. Every status mutation is transactional and audited; enrollment confirmation serializes against program capacity.

Public: /api/public/catalog. Authenticated: /api/platform/*. Existing account and onboarding endpoints remain. See API.md for exact routes and status graphs. No frontend localStorage demo state drives the active service workflows.

## Acceptance criteria and open decisions

Verify complete service journeys, record persistence after reload, partner ownership, forbidden privilege escalation, duplicate requests, invalid status transitions, capacity, date validation, separate report/verification states, mobile layouts and accessible forms. No sample employer/provider is represented as a verified partnership.

Open: prescribed manuscript format, actual pilot PESO office and partner sources, official program eligibility, privacy/retention, deployment, external integrations, matching evaluation dataset and effectiveness measures.
