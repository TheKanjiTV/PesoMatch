# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — API Contract

## API versioning

`/api/v1` is the canonical API prefix used by the frontend and active browser tests. `backend/routes/api-v1.php` owns the version 1 contract. Unversioned `/api/*` routes remain compatibility aliases with identical controllers, validation, session/CSRF protection, throttling, and authorization. Version 1 responses include `X-API-Version: 1`. Login, registration, and logout also use `/api/v1/auth/*` with web-session middleware; `/sanctum/csrf-cookie` remains unchanged. Unsupported versions return 404. The résumé download link retains its unversioned compatibility URL for already-installed Android companions whose download allowlist predates versioning; the v1 download endpoint is also available.

## Session and authorization

Laravel 12 / Sanctum stateful cookie sessions. Obtain `/sanctum/csrf-cookie` and send the decoded XSRF token on mutations. All `/api/v1/platform/*` routes require authentication. Registration creates a jobseeker; privileged role provisioning requires the local operator or an existing administrator.

Responses: 401 unauthenticated; 403 unauthorized role/ownership; 404 missing record; 409 duplicate request or already-verified report; 422 validation or invalid workflow state. Validation errors appear in `errors`. List endpoints return Laravel `data`, pagination metadata and links, using the administrator-controlled global page size, capped at 20 rows. Catalog queries support `id`, `search` and `status` (training also supports `source_program_id`); vacancies also support `saved=1` for the current user.

Training additionally accepts `catalog=all|registered_program|online_course|overseas_training|partner_program`. Vacancies accept `availability=all|source_lists_open`. Search includes retained source descriptions so full institution/qualification/address text remains searchable. Query values are validated server-side; LIKE wildcard characters are treated literally.

## Public and existing account routes

`GET /api/v1/public/catalog` returns current published vacancies, upcoming training/events, and service names. It does not return personal records. Existing `/api/v1/auth/*`, `/api/v1/jobseeker/onboarding/*`, `/api/v1/jobseeker/profile`, and `/api/v1/skills` remain.

`GET /api/v1/public/source-coverage` returns the committed review date, source counts, priority-location counts and office coverage limitations. It is throttled to 60 requests/minute and does not probe sources, expose accounts or claim live availability. See [national catalog review](NATIONAL-CATALOG-2026-11-06.md).

### Account activity history

`GET /api/v1/auth/history?page=1` returns only the authenticated account's recorded authentication events, ordered by event time and ID, newest first. All roles can read their own history; client-supplied user IDs cannot select another account. Pagination follows the global table setting, capped at 20 rows. Records include `id`, `action`, ISO 8601 `created_at` with a timezone offset, `ip_address`, `user_agent`, and optional `reason`, `method`, and `session_count`.

Supported authentication events are registration, credential and remember-cookie login, logout, failed credentials, account lockout, attempts blocked by an active lockout, IP throttling, sign-in lock contention, password and sign-in email changes, session revocation, detected inactivity expiry, account archive/restore, and permanent account erasure. Role changes and local role provisioning revoke sessions and append the reason. Account switching records the previous account's logout; rejected switches keep the current account signed in. Password changes preserve the current browser session and revoke other sessions and remember tokens.

The same append-only application events appear in `/api/v1/platform/audit`. Administrators can select `category=all|authentication|business`. Failed-login attribution names the target account, not a verified actor. Unknown-email failures and lockouts appear only in the administrator audit with a keyed identity fingerprint, never the submitted email. Malformed validation/CSRF failures remain request errors rather than invented credential checks. Passwords, raw session IDs, cookies, and authentication tokens are never copied to audit details. IP addresses follow configured proxy trust; user agents are client-reported.

`authentication_sessions` stores keyed session hashes and activity deadlines, independently of Laravel session garbage collection. `php artisan peso:expire-auth-sessions` records each tracked inactivity expiry once at its deadline, with a distinct `auth.session_expired` event rather than a fake logout. The command is scheduled every minute; `scripts/hostinger-auth-history-cron.sh` installs a dedicated Hostinger cron job without enabling other schedules. Application requests also detect expired sessions. Browser closure itself cannot be observed reliably. Existing sessions begin tracking when they next use the application; unrecorded events from before activation cannot be reconstructed.

### Archive and permanent deletion

The administrator's **Archive & Restore** page is `/archive`, beside Audit Records and linked from Account Access. `GET /api/v1/platform/archive?kind=all|account|vacancy|training|enrollment|demand&search=...&page=1` unifies recoverable records with global pagination. `POST /api/v1/platform/archive/{type}/{id}/restore` restores an archived record; account restoration requires the current administrator password.

Normal catalog/enrollment removal uses existing soft deletion. Administrator account removal now sets `users.archived_at`, revokes all sessions and remember tokens, and preserves the profile, private résumé, and linked records. Archived accounts cannot sign in or appear in active account lists. Restoring an account preserves its previous role and requires a fresh login. Account email uniqueness remains reserved during archival.

Vacancies and training return as drafts, requiring review before publication. Enrollment restoration retains only withdrawn/rejected terminal history, consumes no capacity, and requires its linked program and account to be restored first; walk-in records do not require an account. Completed training cannot be archived through the removal API or restored into an active request. Archive and restore operations append business audit entries; account archive/restore and access revocation also appear in that account's authentication history.

Permanent personal-data deletion in Account Settings still physically removes the account and cascaded personal records. Explicit résumé deletion, bookmark removal, and expired private AI transcripts retain their permanent-removal semantics. These are not presented as restorable records. Earlier permanent deletions cannot be recovered by the Archive page. Database backups and application keys are preserved during deployment.

## Employment endpoints

Paths below have the `/api/v1/platform` prefix.

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
| GET /audit | Administrator; business and authentication events, optional category filter |
| GET /archive; POST /archive/{type}/{id}/restore | Administrator-only recovery; account restore requires current password |

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

Workflow mutations use transactions and audit records. Vacancy bookmarks use an idempotent owner-scoped database operation. Permanent account erasure cascades personal profiles, referrals, enrollment, placements and employment reports while leaving catalog/audit attribution nullable. Administrator account archival instead preserves these records and disables authentication. Production audit retention/anonymization rules require PESO approval.

## Private résumé endpoints

All paths below require an authenticated jobseeker; ownership comes exclusively from the session.

| Method and path | Behavior |
| --- | --- |
| GET /api/v1/jobseeker/resume | Own extraction and filename, or null; private storage path is omitted |
| POST /api/v1/jobseeker/resume | Multipart `resume` PDF, maximum 5120 KB; first 20 pages of selectable text; 10 requests/minute |
| POST /api/v1/jobseeker/resume/apply | `skills` array of detected skill IDs only; optional `apply_mobile` boolean; additive skill import |
| GET /api/v1/jobseeker/resume/download | Own PDF with private/no-store cache headers |
| DELETE /api/v1/jobseeker/resume | Remove own document/file; previously reviewed profile skills remain |

Detection reports `local-pdf-text-skill-evidence-v1`; this is local text/skill evidence extraction, not a remote LLM or OCR service. Education/work excerpts are advisory text. Existing qualifications and account identity are never overwritten.

Training records can include `source_url`, `source_name`, `source_checked_at` and `external_enrollment`. Source imports are maintained by the local import command, not accepted as arbitrary provenance in catalog forms. External programs can have null capacity/dates and now create a local requested enrollment; PESO must link a verified local intake before confirmation. Every `/matches` vacancy now includes its own `training` list of `{program, addresses}` covering only that vacancy's missing skills.

Training also returns `catalog_type` and `availability_status`. Registered-program rows expose `fee: null`, unknown capacity/dates and `intake_unconfirmed`; registry presence does not confirm an open intake or scholarship. Overseas announcements are labeled `official_announcement` and retain their eligibility restrictions. External training evidence cannot be edited through the normal program mutation endpoint, including by staff; use the reviewed import. Public/current external training requires a source review within 30 days and no passed known end date.

## Official source-listed vacancies

Vacancies can additionally return `source_url`, `source_name`, `source_checked_at`, `source_posted_on`, `source_salary` and `external_application`. Researched external listings have no partner owner and may have null `slots`, `deadline`, `salary_min` and `salary_max`. `source_salary` preserves the source amount without assuming a monthly period.

Published external listings appear in public browse, jobseeker browse and recommendations only while the source was checked within 30 days and any stated deadline has not passed. This is a research recency policy, not confirmation that a position remains unfilled. A recheck is required before updating source timestamps. Source metadata is not editable through ordinary vacancy forms. The source import command updates unique URLs without duplicating records.

Vacancy `availability_status` separates `source_lists_open`, `confirm_availability`, `review_expired`, `deadline_passed` and `partner_vacancy`. Source-listed-open requires an explicitly supported deadline-bearing source, a check within seven days and an unexpired source deadline. It does not guarantee remaining places. Imports reject unapproved source destinations or ownership conflicts and may unpublish withdrawn external records without deleting workflow history.

Jobseekers can save a source-listed vacancy and request general PESO application guidance. `POST /api/v1/platform/vacancies/{id}/referrals` creates a local PESO review request for a current external listing. PESO must record `source_confirmation` before moving it to referred; no external employer submission is automated. Connected partner vacancies retain the local reviewed referral/placement flow.


## November 7 additions

Private requests can send `X-Peso-User`. A mismatch with the authenticated session returns `409` with `code: SESSION_CHANGED`; the header never grants access. `/api/v1/auth/user` remains the server identity authority.

- `POST /api/v1/platform/training/{program}/intakes`: PESO/admin only; requires provider, location, mode, capacity, starts_on, ends_on, schedule, fee and intake_verification (20–4000 characters). Creates a separate local program with `source_program_id`. Internal verification text is omitted from program JSON. `GET /training?source_program_id={id}` lists linked local intakes.
- `PATCH /api/v1/platform/enrollments/{id}`: external confirmation additionally requires `intake_program_id`, an upcoming provider-verified published local intake for that exact source. Capacity and duplicate checks apply transactionally.
- `PATCH /api/v1/platform/referrals/{id}`: external transition to referred requires staff `source_confirmation` evidence (20–2000 characters); officer/time/evidence are retained in the match snapshot.
- `POST /api/v1/platform/delete-intents`: `{type: vacancy|training|enrollment|account, id}` returns encrypted `token` and `wait_seconds: 5`. Requires a stateful authenticated session and target permission.
- `DELETE /api/v1/platform/remove/{type}/{id}`: `{confirmation_token}`; account erasure also requires the acting administrator's `current_password`. Intent is session/actor/target-bound, unlocks in five seconds, expires in five minutes and is consumed. Catalog/request removal uses soft deletion; active own enrollment requests become withdrawn first. Completed enrollment removal is rejected. Account Access cannot delete the current account or last administrator.
- Events & Programs is retired. Both API aliases return 404 for event reads and mutations; the former `/events` workspace URL redirects to Overview. Existing historical database records are retained and public catalog JSON no longer includes events.

Existing role/ownership, notice, workflow, password, audit and privacy checks remain. See [November 7 update](WORKSPACE-UPDATE-2026-11-07.md).


Current Training Enrollment UI uses the existing withdrawal PATCH transition only; its duplicate delete-request action/dialog has been removed. The generic guarded removal API is unchanged for compatibility. The full workspace guide performs page reads and saves only the existing tutorial preference; it never submits referral/enrollment/placement mutations or changes a role.


## November 25 archive management and request limits

Training Demand supports `POST /training-demands/{id}/archive` for an owning jobseeker or PESO staff/admin, and `POST /training-demands/archive-topic` with an exact `topic_key` for PESO staff/admin. Topic archival affects only active requests for that topic, preserves catalog programs/enrollments, and appends one `demand.archived` audit per request. Active lists and interest totals exclude archived requests. Administrators restore them from the general Archive page; an explicit repeat request also reactivates the original unique person/topic row.

Admin-only `POST /archive/delete-intents` takes `{type: account|vacancy|training|enrollment|demand, id}` for an already archived record and returns a five-second session-bound token, exact label and linked-record counts. `DELETE /archive/{type}/{id}` requires that token, an exact `confirmation_name`, and the acting administrator's `current_password`. It expires after five minutes, is consumed once, refuses restored records and rejects changed linked totals with 409. Account deletion removes private résumé/profile and personal service records but keeps owned catalog listings and audit history. Vacancy deletion removes bookmarks, interview practices, referrals and placements; independent employment reports keep their data with cleared placement links. Training deletion removes linked enrollments but preserves separate source intakes/topic requests with cleared source links. Each permanent deletion appends a business audit event.

Numeric request limits use distinct operation prefixes shared by legacy/v1 aliases. AI status/read/delete requests no longer consume the generation quota; matching permits 60/minute, generation 15/minute, per account. The general platform limit is 360 reads/minute and 60 writes/minute. Existing staged sign-in lockouts and the login IP limit remain enforced. Generic 429 messages display the server's retry interval and preserve form entries; mutations are never automatically replayed.
