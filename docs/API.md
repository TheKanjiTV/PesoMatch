# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — API Contract

## Session and authorization

Laravel 12 / Sanctum stateful cookie sessions. Obtain `/sanctum/csrf-cookie` and send the decoded XSRF token on mutations. All `/api/platform/*` routes require authentication. Registration creates a jobseeker; privileged role provisioning requires the local operator or an existing administrator.

Responses: 401 unauthenticated; 403 unauthorized role/ownership; 404 missing record; 409 duplicate request or already-verified report; 422 validation or invalid workflow state. Validation errors appear in `errors`. List endpoints return Laravel `data`, pagination metadata and links, with up to 100 rows per page. Catalog queries support `id`, `search` and `status`; vacancies also support `saved=1` for the current user.

Training additionally accepts `catalog=all|registered_program|online_course|overseas_training|partner_program`. Vacancies accept `availability=all|source_lists_open`. Search includes retained source descriptions so full institution/qualification/address text remains searchable. Query values are validated server-side; LIKE wildcard characters are treated literally.

## Public and existing account routes

`GET /api/public/catalog` returns current published vacancies, upcoming training/events, and service names. It does not return personal records. Existing `/api/auth/*`, `/api/jobseeker/onboarding/*`, `/api/jobseeker/profile`, and `/api/skills` remain.

`GET /api/public/source-coverage` returns the committed review date, source counts, priority-location counts and office coverage limitations. It is throttled to 60 requests/minute and does not probe sources, expose accounts or claim live availability. See [national catalog review](NATIONAL-CATALOG-2026-11-06.md).

## Employment endpoints

Paths below have the `/api/platform` prefix.

| Method and path | Authorized behavior |
| --- | --- |
| GET /summary | Own service counts; PESO/admin operational counts |
| GET /vacancies | Published current catalog; employers see own; PESO sees all |
| POST /vacancies; PATCH /vacancies/{id} | PESO or own employer submission; partner publication requires review |
| POST /vacancies/{id}/save; DELETE same | Own persisted saved vacancy |
| POST /vacancies/{id}/referrals | Jobseeker requests own referral; optional notes |
| GET /matches | Jobseeker profile-based vacancy and training suggestions |
| GET /training | Published upcoming catalog; providers see own; PESO sees all |
| POST /training; PATCH /training/{id} | PESO or own provider submission |
| POST /training/{id}/enroll | Jobseeker; required accepted consent; optional notes |
| GET /referrals | Own jobseeker, PESO/admin all, employer's referred candidates |
| PATCH /referrals/{id} | Authorized next status, notes, interview_at when applicable |
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

Training records can include `source_url`, `source_name`, `source_checked_at` and `external_enrollment`. Source imports are maintained by the local import command, not accepted as arbitrary provenance in catalog forms. External self-paced courses can have null capacity/dates and cannot create a local enrollment; the provider handles enrollment. Every `/matches` vacancy now includes its own `training` list of `{program, addresses}` covering only that vacancy's missing skills.

Training also returns `catalog_type` and `availability_status`. Registered-program rows expose `fee: null`, unknown capacity/dates and `intake_unconfirmed`; registry presence does not confirm an open intake or scholarship. Overseas announcements are labeled `official_announcement` and retain their eligibility restrictions. External training evidence cannot be edited through the normal program mutation endpoint, including by staff; use the reviewed import. Public/current external training requires a source review within 30 days and no passed known end date.

## Official source-listed vacancies

Vacancies can additionally return `source_url`, `source_name`, `source_checked_at`, `source_posted_on`, `source_salary` and `external_application`. Researched external listings have no partner owner and may have null `slots`, `deadline`, `salary_min` and `salary_max`. `source_salary` preserves the source amount without assuming a monthly period.

Published external listings appear in public browse, jobseeker browse and recommendations only while the source was checked within 30 days and any stated deadline has not passed. This is a research recency policy, not confirmation that a position remains unfilled. A recheck is required before updating source timestamps. Source metadata is not editable through ordinary vacancy forms. The source import command updates unique URLs without duplicating records.

Vacancy `availability_status` separates `source_lists_open`, `confirm_availability`, `review_expired`, `deadline_passed` and `partner_vacancy`. Source-listed-open requires an explicitly supported deadline-bearing source, a check within seven days and an unexpired source deadline. It does not guarantee remaining places. Imports reject unapproved source destinations or ownership conflicts and may unpublish withdrawn external records without deleting workflow history.

Jobseekers can save a source-listed vacancy and request general PESO application guidance. `POST /api/platform/vacancies/{id}/referrals` returns 422 for an external listing; the official website handles its actual application. Connected partner vacancies retain the local reviewed referral/placement flow.
