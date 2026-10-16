# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO)

## Document status and format

This draft aligns the system description with the revised title and implemented modules. It uses the repository's existing Markdown heading/table style. The faculty's prescribed manuscript, chapter outline, margins, citation style, and institutional template were not available; this draft does not claim compliance with an unseen academic format. Original research results, respondents, effectiveness percentages and pilot adoption are not fabricated.

## Project overview

The proposed system expands PesoMatch into an end-to-end employment facilitation platform for PESO. It connects jobseeker registration and profiling, vacancy management, job matching and referral, upskilling recommendations and enrollment, employment facilitation and placement, labor market information, and continuing monitoring of jobseeker employment outcomes.

The employment journey continues beyond recommending a job. Jobseekers can request PESO guidance, enroll in training subject to provider confirmation, follow referral and interview updates, review a verified placement, and report later employment changes. PESO officers retain responsibility for counseling, referrals, evidence verification and follow-up.

## Problem addressed

A matching-only application does not provide a complete record of what happens after a vacancy is suggested. PESO needs connected records for the individual's profile, referral handling, skills development, training enrollment, placement verification and later employment status. The revised system organizes these activities as related services rather than a social-network-style feed.

The actual prevalence and severity of these problems at a pilot office must be established through approved interviews, observation and baseline records. No unsupported local statistics are asserted here.

## General objective

Develop an AI-powered employment facilitation platform that supports the PESO employment journey from jobseeker registration and profiling through upskilling, placement and monitoring of employment outcomes.

## Specific objectives

1. Provide validated jobseeker registration and persistent profiling of education, declared skills, qualifications, experience and employment preferences.
2. Allow PESO and authorized employers to manage vacancy information through reviewed publication.
3. Provide explainable vacancy recommendations and facilitate human-reviewed referrals, interviews and employer selection updates.
4. Recommend training and skills development connected to declared skill gaps.
5. Implement training enrollment requests, eligibility/capacity review, confirmation, progress and provider-recorded completion.
6. Record verified employment placement with start-date evidence and a follow-up schedule.
7. Present platform-scoped labor market information to support service planning and reporting.
8. Monitor reported employment outcomes separately from PESO verification and identify due placement follow-ups.
9. Support PESO counseling, orientation, employability assessment, livelihood/reintegration referral and employment program coordination through service records.

## System users and responsibilities

| User | Responsibilities |
| --- | --- |
| Jobseeker | Maintain own profile; explore opportunities/training; request services; follow records; report status |
| PESO officer | Review profiles/catalog; facilitate referrals and services; coordinate providers; verify placement/outcomes |
| Employer | Submit own vacancies; coordinate referred candidates; update interviews, offers and selection results |
| Training provider | Maintain own programs; review eligibility/capacity; confirm enrollment; record progress/completion |
| Administrator | PESO operations; provision account access; inspect changes and audits |

Public registration is jobseeker-only. Partner/staff access is provisioned by an administrator on existing accounts. Backend authorization is authoritative.

## Functional modules

| Required terminology | Implementation |
| --- | --- |
| Jobseeker Registration & Profiling | Account registration, saved onboarding, own profile editing, PESO registry |
| Vacancy Management | Partner/PESO catalog, publication review, skills, deadlines, positions and salary |
| Job Matching & Referral | Content-based recommendations, explanations, request, referral, interview and offer records |
| Training & Skills Development Recommendation | Programs ranked against missing declared skills in recommended vacancies |
| Training Enrollment | Request, consent, provider/PESO confirmation, progress, completion reference and withdrawal |
| Employment Facilitation & Placement | PESO verification of offered employment, evidence, start date, follow-up schedule |
| Labor Market Information | Non-sample vacancy/skill demand, CSV, platform-scoped monitoring aggregates |
| Monitoring of Jobseeker Employment Outcomes | Status reports, verification, latest status, placement linkage and due follow-up |

PESO's wider service responsibilities are mapped in PESO-RESPONSIBILITIES.md. The platform supports case handling and documentation; it does not replace staff judgment or statutory agency processes.

## Process flow

Jobseeker Registration & Profiling → Vacancy Management → Job Matching & Referral → optional Training Enrollment / Skills Development → Employment Facilitation → Placement → Employment Outcome Monitoring.

Labor Market Information and PESO services support the entire process. Training may run before, during or independently of referral. The software does not impose training as a universal prerequisite to employment.

1. A jobseeker registers and completes the five saved profile sections, optionally uploading a selectable-text PDF and reviewing detected skill evidence.
2. A PESO officer reviews employer/provider submissions for publication.
3. The recommender identifies declared skill overlap and suggests relevant vacancies and training.
4. The jobseeker requests a referral or training enrollment; authorized staff/provider reviews the request.
5. The employer coordinates interviews and records an offer or selection result.
6. PESO verifies the employment start and records evidence plus a follow-up date.
7. The jobseeker/PESO reports current employment status; PESO verifies the source before the follow-up is considered complete.

## AI component and evaluation boundary

The implemented AI component is a content-based recommendation baseline using declared skill coverage and TF-IDF cosine similarity between profile/preferences and vacancy text. It produces a score, matched skills, missing declared skills and method version. Training recommendations address those identified gaps.

Scores are not predefined UI examples. They are computed from stored data. However, this implementation is not a trained predictive hiring model, a validated skills test, or an externally connected language model. Missing skills mean missing declared evidence, not proof of inability. No sensitive demographic fields enter the score. PESO reviews referral appropriateness and the employer decides hiring.

Before claiming effectiveness, evaluate recommendations against a consented pilot dataset and expert relevance judgments. Suggested measures include precision/recall at a selected rank, explanation usefulness, staff agreement, completion time, accessibility and user satisfaction. Actual experimental values remain to be collected.

## Architecture and data

React JSX, Vite and Tailwind provide the interface. Laravel PHP provides validation, authorization, CSRF-protected cookie sessions, transactional workflow updates and persistence. Laragon MySQL (`peso_employment`) is the current local database. Existing source rows were backed up, copied and compared before the connection changed. PHPUnit uses isolated SQLite :memory: and browser workflows exercise the active MySQL backend.

Private résumé documents retain extraction evidence and user-reviewed skill imports. Core records are users/profiles and their related education/skills/preferences, vacancies, training programs, enrollment, referrals, placements, employment outcomes, PESO service requests/events, saved vacancies and audit events. Refer to API.md for payloads, route permissions and transition graphs.

## Scope and limitations

The local implementation includes the required service modules and a replacement visual identity across public, account, profile and role-specific workspaces. All active service actions persist in Laravel. Existing accounts were preserved with additive migrations and a pre-change local database backup.

Ten official PhilJobNet source-listed vacancies across Luzon, Visayas and Mindanao and eighteen nationwide TESDA Online Program courses are imported with source URLs and check dates, and enrollment links open the provider website. Source-listed jobs use the official application website rather than a fabricated local referral. Unknown deadlines, positions and pay periods remain unstated; these records are excluded from partner position totals. Source-listed jobs leave browse/matching after 30 days without a researched refresh. Authored skill mappings support recommendations and do not establish qualification equivalence. Illustrative vacancy/local program records remain visibly labeled. There is no configured government data feed, TESDA/PEIS API, official scholarship allocation, National Certificate issuance, mail delivery or production hosting. A training completion reference is a provider's record, not formal national certification. Actual partner records and eligibility criteria require approved sources.

PESO staff conduct counseling, administer assessments, check documents, and verify evidence. The system schedules and records these activities. It does not automatically award benefits or determine legal eligibility. Operational privacy, retention, government reporting format, pilot office and deployment decisions require stakeholder confirmation.

## Verification

Refer to VERIFICATION.md for actual automated results. Coverage includes account/profile regression, permissions, ownership, publication review, duplicate protection, capacity, status transitions, placement evidence, reported/verified outcomes, desktop/mobile navigation, forms and accessibility. Historical tests for the retired feed-based prototype are explicitly separated from the current suite.

## References and supporting documents

- [RA 10691](https://lawphil.net/statutes/repacts/ra2015/ra_10691_2015.html), used for the PESO responsibility mapping.
- [TESDA enrollment guidance](https://knowledgebase-bsrs.tesda.gov.ph/article/how-to-enroll-to-a-program), used to distinguish enrollment request and provider confirmation.
- REQUIREMENTS.md, PESO-RESPONSIBILITIES.md, API.md, DESIGN.md and VERIFICATION.md describe the current implementation and its limits.
