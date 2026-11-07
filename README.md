# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO)

PesoMatch now implements a PESO service workspace with a redesigned public portal, account/profile setup, jobseeker, PESO, employer, provider and administrator workflows. React JSX + Tailwind CSS; Laravel PHP + Sanctum; persistent Laragon MySQL records locally.

## Start locally

This repository contains application source, migrations, tests, lockfiles, public-source catalog snapshots and runtime assets. Local `.env` files, MySQL/SQLite data, account passwords, private résumés, sessions, backups, dependencies, generated builds/APKs and Impeccable tooling are excluded. Your existing local employer/admin accounts remain in MySQL; they are not copied into GitHub or a new clone.

For a **new clone**, install dependencies, copy `backend/.env.example` to `backend/.env`, configure your own database and credentials, and run `php artisan key:generate` from `backend/` before migrating/seeding. Use a separate migration identity for schema changes, then least-privilege app access. The example environment deliberately contains no application key or database password. Do not regenerate the key or overwrite `.env` on an existing installation with encrypted data. Impeccable is optional local design tooling, not an application runtime dependency.

For the measured October 13 performance revision, see [production baseline and optimization results](docs/PERFORMANCE.md) and the [production deployment checklist](docs/PRODUCTION-DEPLOYMENT.md).

Keep the existing backend .env, application key and database. From backend/, run:

```powershell
composer install
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

The active Laragon database is `peso_employment` on MySQL at 127.0.0.1:3306. At the original database migration, 134 then-existing accounts and all source rows were copied and compared before switching the connection; this historical transfer count is not the current account total. The original SQLite database and a private consistent backup under `.local/backups/` remain available. For a fresh installation, create the configured MySQL database, copy .env.example to .env, and generate an application key before migrating. Never run migrate:fresh against existing data.

From the project root:

```powershell
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1
```

Open [the local platform](http://127.0.0.1:8443). Vite proxies /api and /sanctum to Laravel at 127.0.0.1:8000. Keep one hostname per session. Both processes are required.

Optional fictional catalog:

```powershell
php artisan db:seed --class=EmploymentSampleSeeder
```

This seeder belongs in backend/. It creates visibly labeled sample vacancies, programs and an event, without creating users, referrals, enrollment or outcomes.

To import the committed researched public-source catalogs from backend/:

```powershell
php artisan peso:import-verified-vacancies
php artisan peso:import-verified-training
php artisan peso:import-verified-public-resources
```

These commands are idempotent. Recheck sources before editing the dataset/check timestamp. External jobs are excluded from browse/matching after 30 days without a researched refresh; no ongoing source synchronization is claimed.

The [November 6 national catalog review](docs/NATIONAL-CATALOG-2026-11-06.md) records 498 PESO/government vacancy references and 22,086 training records. Only 61 vacancy records have a recently checked source and an unexpired published deadline; remaining places still require office confirmation. Most training entries are registered institution-program records, not confirmed open intakes. The earlier [vacancy-provider replacement](docs/PESO-VACANCY-SOURCES.md) and [November 3 refresh](docs/DATA-REFRESH-2026-11-03.md) remain historical evidence. PSA figures retain their actual reference period.

Current revision: [November 7 session, facilitation, deletion and theme update](docs/WORKSPACE-UPDATE-2026-11-07.md). Browse the [documentation index](docs/README.md).

## Included flows

| Module | Behavior |
| --- | --- |
| Jobseeker Registration & Profiling | Real accounts, saved five-section profile, private PDF résumé analysis and reviewed skill import |
| Vacancy Management | Staff catalog management; employer submissions require PESO publication review |
| Job Matching & Referral | Explainable skill coverage + TF-IDF recommendations, skill gaps, requests, interviews, offers |
| Training & Skills Development Recommendation | Programs ranked by relevant missing skills |
| Training Enrollment | Request, confirmation with capacity checks, progress, completion reference, withdrawal |
| Employment Facilitation & Placement | PESO verifies an offered referral with start-date evidence and a follow-up date |
| Labor Market Information | Active non-sample partner vacancy demand and skill frequency; separate source-listed job count; staff outcome and follow-up reports |
| Monitoring of Jobseeker Employment Outcomes | Own reports, PESO verification, linked placement follow-up, latest status per jobseeker |
| PESO support | Counseling, orientation, employability assessments, livelihood and reintegration referrals, special-group/program coordination |

Public registration is jobseeker-only. Register an account, then provision partner/staff access locally from backend/:

```powershell
php artisan peso:access <registered-email> admin
```

Valid roles: jobseeker, employer, training_provider, peso_staff, admin. An administrator can then use Account Access to manage other existing accounts. No default privileged credentials are shipped.

## Contrast and mobile applications

Use the sun/moon icon to switch light/dark mode. Enable Larger text with the on/off switch in Account Settings. Preferences persist on the device. The landing includes an interactive 3D career folio, pause/reset controls and reduced-motion fallback. Mobile workspaces use bottom navigation and a full service drawer.

For PWA installation and the built Android APK, open [Install PESO](http://127.0.0.1:8443/app). To try the Android APK on the same Wi-Fi:

```powershell
pnpm build
pnpm mobile:preview
```

Open the printed LAN address followed by `/app` on the phone. Enter that platform address at first Android launch. `pnpm android:build` rebuilds the local APK. See [mobile setup, HTTPS deployment and release boundaries](docs/MOBILE-APP.md). The companion needs a reachable platform server; no personal records are available offline.

## Scope

All new service actions are backed by Laravel. Reviewed PESO/government vacancies, the nationwide TESDA registered-program directory, TESDA Online Program courses and one official overseas training announcement carry source URLs and review dates. Search covers institutions, qualifications and addresses, with catalog and availability filters and priority-location shortcuts. The source coverage panel explains offices with no verified current public listing. Source-listed jobs open the official page; they do not pretend to have connected partner accounts. Unknown deadlines, slots, fees and pay periods stay explicitly unstated. Registered programs require intake confirmation; they are not automatically free or self-paced. Source details now create local PESO referral/enrollment requests. PESO verifies the employer before referring and creates a separate provider-confirmed local training intake before confirming source enrollment; external submissions and official admission are not automated. Existing sample vacancies and local programs remain visibly fictional. See [source evidence](docs/DATA-SOURCES.md). The matching implementation is an explainable content-based recommender baseline, not a validated predictive hiring model or external LLM. It must be evaluated with pilot data before making effectiveness claims. It does not infer eligibility from sensitive personal attributes.

No TESDA/PEIS/government integration, official certification, scholarship reservation, email delivery or production deployment is configured. PESO facilitates; providers confirm enrollment; employers decide hiring. A provider completion reference is not a TESDA National Certificate.

The résumé analyzer reads selectable PDF text using Poppler `pdftotext` (5 MB, first 20 pages), suggests catalog skills with evidence, and imports only reviewed skills and an optional reviewed mobile number. Scanned/image PDFs need OCR first. Education and work text are shown for review without inventing dates or credentials. No résumé is sent to an external model. Set `RESUME_PDFTOTEXT` to the executable path. See [résumé and data setup](docs/RESUME-AND-DATABASE.md).

Jobseekers sign in at `/login`; staff and partners can use `/staff/login`. Authentication is shared and server roles determine access. The former “Public services portal” link is now “Public home” and returns to `/`. First-time users receive a role-specific Next/Skip/Close tutorial; replay it in Account Settings.

## Checks

```powershell
pnpm build
pnpm test
cd backend
php artisan test
```

The current browser suite lives in tests/platform/. Earlier tests under tests/ describe the retired social/feed demo and are retained as historical references, outside the active test directory. PHPUnit always uses SQLite :memory:. See docs/VERIFICATION.md for actual results.

See [requirements](docs/REQUIREMENTS.md), [design](docs/DESIGN.md), [PESO responsibilities](docs/PESO-RESPONSIBILITIES.md), [API contract](docs/API.md), and [implementation-aligned document](docs/PROJECT-DOCUMENTATION.md). The professor's manuscript/chapter template was not supplied; existing Markdown conventions are preserved pending that template.
