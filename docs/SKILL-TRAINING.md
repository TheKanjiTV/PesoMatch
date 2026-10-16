# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Training & Skills Development

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
