# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — API Contract

## Session and authorization

Laravel 12 / Sanctum stateful cookie sessions. Obtain `/sanctum/csrf-cookie` and send the decoded XSRF token on mutations. All `/api/platform/*` routes require authentication. Registration creates a jobseeker; privileged role provisioning requires the local operator or an existing administrator.

Responses: 401 unauthenticated; 403 unauthorized role/ownership; 404 missing record; 409 duplicate request or already-verified report; 422 validation or invalid workflow state. Validation errors appear in `errors`. List endpoints return Laravel `data`, pagination metadata and links, with up to 100 rows per page. Catalog queries support `id`, `search` and `status` (training also supports `source_program_id`); vacancies also support `saved=1` for the current user.

Training additionally accepts `catalog=all|registered_program|online_course|overseas_training|partner_program`. Vacancies accept `availability=all|source_lists_open`. Search includes retained source descriptions so full institution/qualification/address text remains searchable. Query values are validated server-side; LIKE wildcard characters are treated literally.

## Public and existing account routes

`GET /api/public/catalog` returns current published vacancies, upcoming training/events, and service names. It does not return personal records. Existing `/api/auth/*`, `/api/jobseeker/onboarding/*`, `/api/jobseeker/profile`, and `/api/skills` remain.

`GET /api/public/source-coverage` returns the committed review date, source counts, priority-location counts and office coverage limitations. It is throttled to 60 requests/minute and does not probe sources, expose accounts or claim live availability. See [national catalog review](NATIONAL-CATALOG-2026-11-06.md).

### Account activity history

`GET /api/auth/history?page=1` returns only the authenticated account's recorded login, logout, and failed sign-in events, newest first. All account roles can read their own history; client-supplied user IDs cannot select another account. Pagination follows the administrator's global table setting, capped at 20 rows. Records include `id`, `action`, ISO 8601 `created_at` with a timezone offset, `ip_address`, `user_agent`, and optional `reason`.

Laravel web-guard authentication events append `auth.login`, `auth.logout`, and `auth.login_failed` to the existing `audit_events` table. Remember-cookie authentication also records a login. A successful switch to another account records the previous account's logout with `reason=account_switched`; a rejected switch does not log out the current account. Failed credential checks are attached to an existing target account; unknown emails and requests rejected before authentication (validation, throttling, or an existing lockout) do not create account events. Passwords, cookies, session IDs, and authentication tokens are never copied into activity details.

The Account Settings history table displays Philippine time, IP address, and the browser's reported user agent. The administrator's existing `/api/platform/audit` feed includes the same persisted events, with full date and time in the Audit Records table. Failed-login attribution identifies the target account, not a verified actor. IP addresses follow the application's configured trusted-proxy handling; user agents are client-reported.

Recording begins with this release. Earlier unrecorded authentication cannot be reconstructed. Browser closure and passive session expiry do not generate logout events. Explicit logout, account switching, and web-guard logout during self-deletion do; deleting an account leaves its audit entry with a nullable actor link. This change reuses the existing audit table and needs no schema migration.

## Employment endpoints

Paths below have the `/api/platform` prefix.

Vacancy lists accept `location`, `employment_type`, `organization` and `sort=newest|oldest|title|-title`. Employers use `scope=mine` for their records across statuses. With `scope=all&id={id}`, an employer can open their own vacancy or a current published listing. Other private IDs return an empty list. The directory exposes organization names and counts from published vacancies.

Vacancy statuses include `draft`, `pending_review`, `published`, `on_hold`, `cancelled` and `closed`. Employer submissions for publication enter `pending_review`. Employer edits and timed removal requests use the signed-in account's ownership. Candidate decisions require a PESO handoff for a vacancy the employer owns.

| Method and path | Authorized behavior |
| --- | --- |
| GET /summary | Own service counts, employer vacancy and candidate counts, or PESO operational counts |
| GET /vacancies | Current published catalog for jobseekers. Employers default to their own records and can use `scope=all` to browse published openings. PESO sees all. |
| GET /employers | Employer and PESO roles can browse published vacancy counts by organization |
| POST /vacancies / PATCH /vacancies/{id} | PESO or owner employer submission. PESO controls publication. |
| POST /vacancies/{id}/save; DELETE same | Own persisted saved vacancy |
| POST /vacancies/{id}/referrals | Jobseeker requests own referral; optional notes |
| GET /matches | Jobseeker profile-based vacancy and training suggestions |
| GET /training | Published upcoming catalog; providers see own; PESO sees all |
| POST /training; PATCH /training/{id} | PESO or own provider submission |
| POST /training/{id}/enroll | Jobseeker; required accepted consent; optional notes |
| GET /referrals | Own jobseeker, PESO/admin all, employer's referred candidates |
| PATCH /referrals/{id} | Authorized next status and notes. Employers may accept a PESO-referred candidate, schedule an interview, offer or decline within their own vacancies. |
| POST /referrals/{id}/placement | PESO/admin only; offered referral and verification evidence required |
| GET /enrollments | Own jobseeker, PESO/admin all, own provider learners |
| PATCH /enrollments/{id} | Authorized next status; notes; completion reference when completing |
| GET /placements | Own jobseeker, PESO/admin all, own employer placements |
| GET /outcomes; POST /outcomes | Own jobseeker reports; PESO/admin can report for a jobseeker |
| PATCH /outcomes/{id}/verify | PESO/admin verification_notes and immutable verification timestamp |
| GET /services; POST /services | Own jobseeker cases; PESO/admin can read all |
| PATCH /services/{id} | PESO handling; own jobseeker cancellation |
| GET /events | Published events; PESO/admin also see drafts |
| POST /events; PATCH /events/{id} | PESO/admin program coordination |
| GET /labor-market | Aggregate non-sample vacancy information; monitoring visible only to PESO/admin |
| GET /jobseekers | PESO/admin registry and declared profile evidence |
| GET /users; PATCH /users/{id}/role | Administrator provisions access on other existing accounts |
| GET /audit | Administrator; latest actions and changes |

## Record payloads

Vacancy: title, organization, location, industry, employment_type, description, skills[], slots, nullable salary_min/salary_max, deadline, status. Partner status is forced to pending_review unless closing their vacancy. API payload cannot assign ownership or mark a record as verified/sample.

Training: title, provider, location, mode, description, requirements, skills[], capacity, starts_on, ends_on, schedule, fee, status. Partner status is forced to pending_review unless closing. Capacity cannot fall below confirmed/in-progress/completed enrollment count.

Placement: started_on (not future), employment_type, evidence (minimum 10 characters), follow_up_on (future). Stored against the referral and its authenticated jobseeker; vacancy position count prevents excess placements.

Employment outcome: status, reported_on (not future), notes, optional organization/job_title/placement_id. PESO may specify user_id for a jobseeker. A jobseeker cannot override ownership with a supplied user_id. Linked placement must belong to that same jobseeker. Verification is a separate PESO action.

Service request: service from the defined catalog, details. PESO updates status, optional assigned_to, appointment_at and staff_notes. Assignment must be a PESO/admin account. Scheduling requires a future appointment. Datetime forms explicitly submit the Philippine UTC+08:00 offset; the Laravel app timezone is Asia/Manila.

## Status contracts

| Entity | Allowed progression |
| --- | --- |
| Referral | requested → referred → interviewing / offered → placed; active states may move to not_selected / withdrawn within the declared transition graph |
| Enrollment | requested → confirmed → in_progress → completed; requested may be rejected; active enrollment may be withdrawn |
| Service | requested → scheduled / in_progress; scheduled → in_progress / completed; in_progress → completed; active cases may be cancelled |
| Outcome | Reported status remains a report until a PESO officer adds verification evidence; a verified record cannot be reverified |

Jobseekers cannot self-approve referrals/enrollment or placement. Employers cannot see unreviewed referral requests or verify placement/outcomes. Providers cannot see another provider's enrollment records. Terminal states cannot be reopened by resubmitting a status mutation. A new training intake should be a new program record.

## Matching and reporting

`content-based-tfidf-v1`: 75% declared skill coverage + 25% TF-IDF cosine similarity. Returned matched/missing skills are explanations, not eligibility decisions. A snapshot is stored with the referral.

Matching returns at most 100 training suggestions, with the full count in `training_total`. Each paginated vacancy match includes up to eight related training suggestions and its own `training_total`. The full training directory remains available through `/training` pagination; suggestion limits do not change matching scores or delete programs.

Labor-market demand excludes sample vacancies and external source listings with unknown positions. `source_listed_vacancies` separately counts recently researched external listings. Monitoring uses the latest reported employment date per jobseeker, breaking ties by record ID, and shows verified counts separately. Sample-linked outcomes/completions are excluded from operational aggregates. Due placement follow-ups remain pending until a linked, verified report covers the follow-up date. Reports are platform-scoped, not population unemployment statistics.

Workflow mutations use transactions and audit records. Vacancy bookmarks use an idempotent owner-scoped database operation. Account erasure cascades personal profiles, referrals, enrollment, placements and employment reports while leaving catalog/audit attribution nullable. Production audit retention/anonymization rules require PESO approval.

## Private résumé endpoints

All paths below require an authenticated jobseeker; ownership comes exclusively from the session.

| Method and path | Behavior |
| --- | --- |
| GET /api/jobseeker/resume | Own extraction and filename, or null; private storage path is omitted |
| POST /api/jobseeker/resume | Multipart `resume` PDF, maximum 5120 KB; first 20 pages of selectable text; 10 requests/minute |
| POST /api/jobseeker/resume/apply | `skills` array of detected skill IDs only; optional `apply_mobile` boolean; additive skill import |
| GET /api/jobseeker/resume/download | Own PDF with private/no-store cache headers |
| DELETE /api/jobseeker/resume | Remove own document/file; previously reviewed profile skills remain |

Detection reports `local-pdf-text-skill-evidence-v1`; this is local text/skill evidence extraction, not a remote LLM or OCR service. Education/work excerpts are advisory text. Existing qualifications and account identity are never overwritten.

Training records can include `source_url`, `source_name`, `source_checked_at` and `external_enrollment`. Source imports are maintained by the local import command, not accepted as arbitrary provenance in catalog forms. External programs can have null capacity/dates and now create a local requested enrollment; PESO must link a verified local intake before confirmation. Every `/matches` vacancy now includes its own `training` list of `{program, addresses}` covering only that vacancy's missing skills.

Training also returns `catalog_type` and `availability_status`. Registered-program rows expose `fee: null`, unknown capacity/dates and `intake_unconfirmed`; registry presence does not confirm an open intake or scholarship. Overseas announcements are labeled `official_announcement` and retain their eligibility restrictions. External training evidence cannot be edited through the normal program mutation endpoint, including by staff; use the reviewed import. Public/current external training requires a source review within 30 days and no passed known end date.

## Official source-listed vacancies

Vacancies can additionally return `source_url`, `source_name`, `source_checked_at`, `source_posted_on`, `source_salary` and `external_application`. Researched external listings have no partner owner and may have null `slots`, `deadline`, `salary_min` and `salary_max`. `source_salary` preserves the source amount without assuming a monthly period.

Published external listings appear in public browse, jobseeker browse and recommendations only while the source was checked within 30 days and any stated deadline has not passed. This is a research recency policy, not confirmation that a position remains unfilled. A recheck is required before updating source timestamps. Source metadata is not editable through ordinary vacancy forms. The source import command updates unique URLs without duplicating records.

Vacancy `availability_status` separates `source_lists_open`, `confirm_availability`, `review_expired`, `deadline_passed` and `partner_vacancy`. Source-listed-open requires an explicitly supported deadline-bearing source, a check within seven days and an unexpired source deadline. It does not guarantee remaining places. Imports reject unapproved source destinations or ownership conflicts and may unpublish withdrawn external records without deleting workflow history.

Jobseekers can save a source-listed vacancy and request general PESO application guidance. `POST /api/platform/vacancies/{id}/referrals` creates a local PESO review request for a current external listing. PESO must record `source_confirmation` before moving it to referred; no external employer submission is automated. Connected partner vacancies retain the local reviewed referral/placement flow.


## November 7 additions

Private requests can send `X-Peso-User`. A mismatch with the authenticated session returns `409` with `code: SESSION_CHANGED`; the header never grants access. `/api/auth/user` remains the server identity authority.

- `POST /api/platform/training/{program}/intakes`: PESO/admin only; requires provider, location, mode, capacity, starts_on, ends_on, schedule, fee and intake_verification (20–4000 characters). Creates a separate local program with `source_program_id`. Internal verification text is omitted from program JSON. `GET /training?source_program_id={id}` lists linked local intakes.
- `PATCH /api/platform/enrollments/{id}`: external confirmation additionally requires `intake_program_id`, an upcoming provider-verified published local intake for that exact source. Capacity and duplicate checks apply transactionally.
- `PATCH /api/platform/referrals/{id}`: external transition to referred requires staff `source_confirmation` evidence (20–2000 characters); officer/time/evidence are retained in the match snapshot.
- `POST /api/platform/delete-intents`: `{type: vacancy|training|enrollment|account, id}` returns encrypted `token` and `wait_seconds: 5`. Requires a stateful authenticated session and target permission.
- `DELETE /api/platform/remove/{type}/{id}`: `{confirmation_token}`; account erasure also requires the acting administrator's `current_password`. Intent is session/actor/target-bound, unlocks in five seconds, expires in five minutes and is consumed. Catalog/request removal uses soft deletion; active own enrollment requests become withdrawn first. Completed enrollment removal is rejected. Account Access cannot delete the current account or last administrator.
- Event mutations accept optional paired `reference_name` (160 chars) and `reference_url` (HTTPS, 700 chars, no embedded credentials). These are user-entered references, not fabricated official-source verification.

Existing role/ownership, notice, workflow, password, audit and privacy checks remain. See [November 7 update](WORKSPACE-UPDATE-2026-11-07.md).


Current Training Enrollment UI uses the existing withdrawal PATCH transition only; its duplicate delete-request action/dialog has been removed. The generic guarded removal API is unchanged for compatibility. The full workspace guide performs page reads and saves only the existing tutorial preference; it never submits referral/enrollment/placement mutations or changes a role.
