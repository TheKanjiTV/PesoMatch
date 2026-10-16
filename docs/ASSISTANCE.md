# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — PESO Services

## Routes and records

/services stores requests for career guidance/counseling, pre-employment orientation, employability assessment, livelihood/self-employment referral, returning-worker reintegration, job-fair assistance, SPES/GIP/JobStart coordination, and displaced-worker/PWD assistance.

/events supports public program listings and PESO-managed program details. /referrals is the dedicated employment referral lifecycle.

## Allowed actions

Jobseekers create their own requests and cancel active requests. PESO officers/admins schedule, assign an officer, record service/referral notes, progress and complete requests. Appointment dates and eligible officer assignments are validated. Employer/provider roles cannot browse personal PESO case records.

Requested → scheduled / in_progress / cancelled; scheduled → in_progress / completed / cancelled; in_progress → completed / cancelled. Terminal records cannot be reopened through status updates.

## Connected workspace

Assistance is part of the employment journey alongside skills development, referrals and employment monitoring. Counseling and program delivery remain the officer/provider's responsibility; recording a service does not automatically award eligibility or a government benefit.

## Verification

Laravel tests cover service ownership, appointment requirements and status transitions. Browser tests create counseling cases and inspect role-specific screens.
