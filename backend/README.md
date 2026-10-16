# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Laravel API

## Local setup

Laravel 12, PHP 8.2+, Composer and SQLite locally. Keep the existing .env and application key. Run composer install, php artisan migrate, php artisan db:seed, then php artisan serve --host=127.0.0.1 --port=8000. Do not run migrate:fresh against existing records.

For a fresh installation, copy .env.example, generate the key, and create database/database.sqlite first. The optional EmploymentSampleSeeder creates fictional catalog records only. Public/partner pages label them as samples.

## Authentication

Sanctum stateful cookie sessions; Vite same-origin proxy. Existing /api/auth registration/login/logout/user/account/password routes remain. Public registration rejects a role field. Provision roles on an existing account with php artisan peso:access <registered-email> <role>. Roles: jobseeker, employer, training_provider, peso_staff, admin.

Role authorization and ownership checks live in EmploymentController. Partner users cannot publish without PESO review, see another partner's records, or verify placements/outcomes.

## Profile endpoints

Existing /api/jobseeker/onboarding and /api/jobseeker/profile endpoints remain. Skills are returned by /api/skills. Onboarding completion requires all five validated saved sections.

Employment APIs are under /api/platform. See ../docs/API.md. Match scoring uses actual profile data and a local content-based TF-IDF baseline. Dates use Asia/Manila.

## Verification

php artisan test runs all account/onboarding and employment feature tests against SQLite :memory:. Never redirect RefreshDatabase to the development database. The new migration adds domain tables without resetting existing accounts. A pre-migration local SQLite backup is ignored by Git.

Production requires pilot source data, an approved privacy/retention policy, delivery configuration, deployment hardening and matching evaluation. No official TESDA/PEIS API is connected.
