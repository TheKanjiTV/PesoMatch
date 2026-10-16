# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Résumé and Database Setup

## Résumé workflow

Jobseekers open **My profile**, or step 3 of profiling, and upload a selectable-text PDF. The server extracts up to the first 20 pages of a PDF no larger than 5 MB. Catalog skill names and maintained aliases produce suggestions with source text evidence. Jobseekers review the checkboxes before importing. Existing skills and qualifications remain intact. An optional detected Philippine mobile number can be applied after review.

Education and work excerpts are available for review beside the normal profile forms. The parser does not invent structured qualifications, dates, proficiency or hiring eligibility. Image/scanned PDFs require OCR before upload. Matching uses the saved reviewed skills; a résumé upload alone cannot inflate the score. Each suggested vacancy includes courses covering its own missing declared skills.

The extractor runs Poppler `pdftotext` using a process argument array, without shell interpolation, with a 20-second timeout. Configure `RESUME_PDFTOTEXT` to an executable on PATH or its absolute location. This machine uses the available Laragon Git-bundled executable. No document is sent to an external AI model.

Files are stored on Laravel's private local disk under `resumes/<authenticated-user-id>/`. API results hide the path. Downloads require the owning jobseeker session and send private/no-store headers. Replacing/deleting a document removes the old file. Account deletion also removes the résumé. Applied profile skills remain when only the PDF is deleted. Audit entries contain skill IDs, not résumé text. Personal API records are excluded from PWA caches.

The Android 1.2.0 local companion adds an explicit system PDF picker and authenticated PDF saving to a user-selected destination. No broad device storage permission is required. Browser/PWA upload uses the normal file input. Physical Android file-picker acceptance still needs a real-device check.

## Active Laragon database

The application now uses MySQL database `peso_employment` on Laragon at `127.0.0.1:3306`, configured in the existing private `backend/.env`. The application key was preserved.

The transfer script first checked SQLite foreign keys, saved a consistent private SQLite snapshot and environment backup, required an empty target, applied migrations, copied every table and compared canonical row hashes before changing the active connection. It normalized JSON object ordering and decimal representation for comparison. All source rows, including 134 users and existing sessions/profiles/service records, were preserved. Ten official source-listed vacancies and eighteen official training records were then imported separately. No applicant, referral, enrollment or outcome activity was invented.

The original `backend/database/database.sqlite` and private `.local/backups/<timestamp>/` snapshots remain as rollback evidence. They are not the active database and will not receive new writes. Database/environment backups are ignored by Git and must remain private. Do not run `migrate:fresh`, the transfer script, or overwrite the active database as a routine startup step.

For ordinary startup, start Laragon MySQL, then run the existing frontend and Laravel services. For new schema changes, use additive `php artisan migrate`. `php artisan peso:import-verified-vacancies` and `php artisan peso:import-verified-training` update the researched public-source catalog idempotently. PHPUnit explicitly uses SQLite `:memory:`; browser tests use disposable accounts against the active MySQL service and remove their own records.

## Access and navigation

`/login` serves jobseekers. `/staff/login` is a dedicated entrance for PESO employees, administrators and partners, using the same session authentication. The server-assigned role determines the workspace and actions. Public registration cannot assign privileged roles. Provision an existing account with `php artisan peso:access <registered-email> peso_staff` or `admin`; subsequent account access is administered from Account Access. No default privileged login is created.

**Public home** returns to `/`; it was previously labeled “Public services portal.” First-time users see the role-specific workspace tutorial with Next, Previous, Skip, Close and Escape. Completion is saved in Laravel; replay is available in Account Settings.
