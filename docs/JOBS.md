# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Vacancy Management

## Source-listed applications and deletion

Official-source records are distinct from illustrative samples. **Apply through PESO · request referral** creates a local request and opens `/referrals`, including for source-listed vacancies. Before referring an external listing, PESO must record current employer contact, availability and application instructions. The source link remains evidence; it is not the only application action. Employers retain hiring authority. Authorized catalog deletion has a five-second confirmation and soft-deletes the item; existing referral history remains and source imports do not restore deleted identities. See [current workflow](WORKSPACE-UPDATE-2026-11-07.md).

## Routes and navigation

/jobs and /jobs/:id. /matches explains profile alignment and links to vacancy details. /referrals manages the resulting service record.

## Discovery and details

Published, unexpired vacancies are visible to jobseekers. PESO officers manage the catalog; employers see/manage only their own vacancies. Partner submissions go to pending_review, regardless of any submitted published status. PESO controls publication. Details include organization, location, industry, employment type, skills, responsibilities, salary range, available positions and deadline.

Save vacancy persists to the authenticated account. Request PESO referral requires a completed profile and prevents duplicates. Closed/expired vacancies reject requests.

## Components and services

src/platform/Catalog.jsx, Records.jsx, api.js; EmploymentController, EmploymentMatcher, Vacancy and Referral models. Referral snapshots preserve assessed skills/gaps and method version at the time of request.

## Motion and accessibility

Visible labels, responsive one/two-column lists, keyboard navigation and explicit request feedback. No social feed/timeline patterns.

## Verification

Backend tests exercise employer ownership, publication review, duplicate/closed requests, status transitions, interview schedules, placement requirements and permissions. Browser checks cover saved vacancy, referral persistence and PESO progression. See VERIFICATION.md.
