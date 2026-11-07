# Loading states

## November 7 compatibility

New source-request, intake, reference-link and removal controls preserve the existing 400 ms minimum resource skeleton behavior. Dashboard routes remain skeleton-only; the PESO logo loader is limited to public/authentication loading and sign-in. Delete countdowns are a separate deliberate five-second confirmation requirement, not a resource-loading delay. See [current workspace update](WORKSPACE-UPDATE-2026-11-07.md).

Only home, login (including staff login), and registration route transitions show the PESO logo loader. Submitting sign-in also shows it until authentication and the handoff finish. Initial workspace/session loading uses matching sidebar, mobile navigation and complete header skeletons (avatar, name, role, appearance control, Install and Public home). Subsequent page/lazy-module navigation uses destination-specific content skeletons while the loaded shell remains usable. The workspace is never covered by a logo loader. Data skeletons retain the 400 ms minimum and remain until the request settles.

Pending page data uses the matching layout in `src/platform/LoadingStates.jsx`. Placeholders remain until the real request settles; an error replaces them with the existing recovery UI. Search inputs stay mounted during result loading, and superseded requests are aborted and ignored. Motion respects device and application preferences.

| Surface | Structure represented |
| --- | --- |
| Home, login, registration and active sign-in | PESO logo and loading indicator; no generic card skeleton |
| Initial workspace/session restoration | Sidebar, complete identity/action header and destination-page skeleton; no PESO loading overlay |
| Sidebar, header and mobile navigation | Initial-only role-specific icon/text rows, branding/footer, identity/actions and five tabs; responsive placeholders match the controls normally visible at that viewport |
| Subsequent navigation, searches and retries | Matching pending content skeleton; loaded sidebar, identity/header actions and mobile tabs remain usable |
| Overview | Heading/action, split banner and pathway, four counters for non-partner roles, task rows and event column |
| Vacancy/training catalog | Two-column cards with badges, title, organization, location, description, skills and footer |
| Catalog detail | Main article and planning sidebar; training requirements are included for training |
| Matching | Ranked summary, alignment score, skill columns and training guidance; training tab uses its own variant |
| Referrals/enrollments/placements/outcomes/services | Record header/status, detail columns and actions |
| Registry | Name/contact row, profile status and review action |
| Access/audit | Four/five-column tables with the same minimum widths as the content |
| Events | Event badge, heading, schedule/location, description and action |
| Labor market | Official report, indicators, demand/skills columns and staff follow-up sections |
| Profile/résumé/settings/privacy | Corresponding identity/details, upload form, preference/account rows and request summaries |
| Onboarding | Actual per-step field grouping, full-width address/school fields, skills and repeatable sections, experience choices, occupation and preference controls |

Unknown record counts and optional saved content cannot be predicted before the response. Placeholder rows describe the page structure without inventing counts or personal facts.

`tests/platform/loading-layouts.spec.js` checks public logo loaders, 22 workspace/onboarding routes in desktop/mobile viewports, error replacement, absence of workspace logo loaders during cold starts and navigation, and Overview geometry/accessibility in both themes. Its responses are intercepted UI fixtures and do not create accounts or catalog records.

## Local account maintenance

`php artisan peso:refresh-local-accounts` previews recognized timestamp-based browser fixture emails under `example.test`. `--apply` is restricted to local/testing environments, preserves other accounts and an existing administrator, and refuses candidates owning non-sample partner catalog data.

Before changes it writes and decrypt-verifies a complete encrypted row snapshot plus affected private document bytes on the private local disk. New demonstration accounts have unique generated passwords delivered in an ignored private Markdown file under `backend/storage/app/private/account-maintenance/`. Passwords are never printed. Repeating the command does not reset their passwords. Demo names are fictional, email uses `demo.example.test`, and profile facts, consent and employment outcomes are not fabricated.


## Shared workspace navigation loading

`WorkspaceLoadingProvider` belongs to the authenticated layout and is keyed by account ID and role. It tracks private resources, including manually loaded profile/résumé sections, for the guide and first workspace load. Its separate initial-readiness latch opens when the first route and its resources settle, including errors. Later page requests do not reset it. Therefore switching modules, searching, pagination and retrying an error never replace the loaded navigation or header with placeholders. Changing the authenticated identity/role starts a fresh shell lifecycle; no private records or credentials are cached by this mechanism.

Public source-coverage requests retain their local fallback without blocking the shell. Role-known sidebar skeletons use the actual visible navigation count; session restoration shows anonymous placeholders until identity resolves. The shared header skeleton also covers the account name, role, Install and Public home instead of leaving live text above loading navigation. Mobile placeholders follow the existing compact header rules, and drawers retain a Close control during initial loading. Cancelled/unmounted resources release their loading registration. Content retains its existing 400 ms minimum.

The full workspace guide still waits for each route/data request before enabling Next and positioning its spotlight, independently of initial shell readiness. Its step is derived from the committed route, avoiding a separate counter drifting during lazy navigation or browser Back. It does not substitute a logo overlay on dashboard routes. `tests/platform/workspace-guide.spec.js` covers initial header/sidebar/mobile loading, failure/retry, navigation away from a pending module, content search and transient shell regressions, plus the role-specific guide journeys.
