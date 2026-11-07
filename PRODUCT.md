# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO)

<!-- impeccable:product-schema 1 -->

## Platform

web, installable PWA, Android companion application

## Stack

Existing React JSX, Vite and Tailwind CSS v4 frontend; Laravel 12 PHP / Sanctum backend. Laragon MySQL is the configured local database (`peso_employment`). The SQLite source was backed up and all rows compared before switching; browser workflows exercise MySQL. PHPUnit remains isolated on SQLite :memory:.

## Users

Jobseekers use registration, profiling, employment guidance, vacancies, referral, training enrollment and outcome reporting. PESO personnel manage facilitation and monitoring. The implementation separates PESO officer, administrator, employer and training-provider access; these role boundaries are implementation decisions based on the requested workflow.

## Product Purpose

Expand PesoMatch into an end-to-end PESO employment facilitation platform with upskilling and employment outcome monitoring.

## Positioning

Connect the same jobseeker profile to vacancies, explainable recommendations, human-reviewed referrals, provider-confirmed enrollment, verified placement, and follow-up employment records.

## Operating Context

Jobseeker Registration & Profiling → Vacancy Management → Job Matching & Referral → Training & Skills Development Recommendation / Training Enrollment → Employment Facilitation & Placement → Monitoring of Jobseeker Employment Outcomes. Labor Market Information and PESO support services span the journey. Training is optional for a referral and is not a hiring prerequisite imposed by the platform.

## Capabilities and Constraints

Public registration creates jobseeker accounts only. Admin access is provisioned on an existing account by a local Artisan command. No publicly selectable privileged roles. AI is an explainable content-based TF-IDF recommendation baseline, not a trained predictive hiring model. PESO and employers retain decision authority. Sample catalog entries remain visibly fictional. No TESDA enrollment API, certification service, scholarship allocation, official PEIS integration, email delivery or government adoption is claimed.

## Brand Commitments

The civic Light Mode layout remains authoritative. The November 7 request explicitly adopts Messenger-inspired charcoal surfaces for Dark Mode and semantic action colors, while preserving the green brand and existing layout. The formal project title above is authoritative. PesoMatch is retained only as the historical repository/product identifier.

## Evidence on Hand

Existing accounts, migrations, profile validation and browser tests were inspected. The sibling Impeccable folder is preserved. Its launcher and concept-seed commands exited 1 without output on this machine; source skill guidance was read directly, so CLI concept generation and Impeccable verification are not claimed.

## Product Principles

- A profile is the start of a continuing service journey.
- AI suggestions explain their evidence and never hire or reject people.
- Distinguish requested, confirmed, completed, reported and verified states.
- Keep permissions on the server and partner records scoped to their owner.
- Label fictional records and report platform data without population-level claims.

## Accessibility & Inclusion

Light/dark icon toggle (internal HC1/HC2 preferences), larger-text on/off switch only in Settings, quiet civic workspace hierarchy, solid working surfaces, visible form labels, keyboard focus, reduced motion, mobile bottom navigation and complete service drawer, loading/error/empty states. The user delegated the meaning of HC1/HC2; these names describe the implemented contrast modes, not an externally supplied accessibility standard. Language preferences, pilot-office processes and accessibility requirements beyond the current WCAG checks remain open.

## Mobile delivery

The PWA installs through supported browsers and provides a safe offline information page. All personal records and mutations require a live connection. The Android companion uses a dedicated WebView, trusted same-origin navigation, existing Laravel session/CSRF protections, Android Back support and a user-selected CSV export destination. The Android project builds a local debug APK; public distribution requires release signing and a deployed HTTPS platform. A same-Wi-Fi development preview is provided without changing existing local account/API configuration.

## Open Decisions

Faculty document template, formal pilot approval for the user-requested PESO Bansud context, partner onboarding rules, program eligibility, consent/retention policy, official data integrations, production deployment and AI evaluation data.
