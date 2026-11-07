# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Training & Skills Development

## Source requests and verified local intakes

The national directory contains registry references, online courses and overseas announcements as well as local programs. **Request enrollment through PESO** creates a local pending request and opens Training Enrollment. A directory listing does not prove current admission, fee or scholarship availability.

PESO uses **Create verified local intake** on a source-program detail, supplying the actual provider, mode, venue, dates, schedule, fee, capacity and verification evidence. This creates a separate local `training_programs` record linked by `source_program_id`, preserving the source registry and its unknown fee. Confirmation of a source request requires selecting an upcoming verified intake for that exact program; the request is linked to the local intake under capacity locks. No external registration, scholarship award or certification is simulated.

Catalog removal uses a five-second server-issued confirmation and soft deletion. Training Enrollment keeps **Withdraw request** as the cancellation action and no longer displays a separate delete-request button or dialog. Withdrawn/rejected/completed history remains visible. See [current workflow and boundaries](WORKSPACE-UPDATE-2026-11-07.md).

## Connected routes

/matches → Skills Development Recommendation → /training/:id → Request enrollment → /enrollments. Training can also be explored directly at /training.

## Data and boundaries

EmploymentMatcher compares declared profile skills with vacancy requirements. Programs are ranked by overlap with missing skills among the top recommended vacancies. Missing declared skills are not proof of inability. No sensitive demographic attributes enter the score.

Content-based matching: 75% skill coverage + 25% TF-IDF cosine similarity of profile skills/occupation/industry and vacancy text. Method version: content-based-tfidf-v1. This is a local explainable recommender baseline, not a trained hiring model or measured effectiveness claim.

Programs persist provider, mode, location, skills, requirements, class schedule, dates, fee, publication state and capacity. The optional sample seeder does not claim TESDA accreditation or actual scholarship availability.

## Interaction and states

Enrollment: requested → confirmed → in_progress → completed. Requested can be rejected; active requests can be withdrawn. Providers/PESO confirm eligibility and capacity. Confirmed, in-progress and completed records occupy program places. Completion requires a provider reference; it does not issue a TESDA National Certificate or automatically alter declared profile skills.

Each jobseeker/program pair has one enrollment record. A withdrawn/rejected record is terminal; a new intake should be a new program record. Enrollment consent is required on submission.

## Checks

Provider ownership, capacity enforcement, terminal-state guards, completion reference and duplicate protection are covered in Laravel tests. Browser tests exercise request, confirmation, progress and completion with reload persistence.


The full role-aware workspace tutorial now visits both Training & Skills Development and Training Enrollment, waits for their real loading states, and explains request versus confirmed-intake progress without submitting a request. Sidebar/mobile navigation displays its own skeleton while these resources load.
