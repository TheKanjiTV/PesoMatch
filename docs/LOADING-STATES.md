# Loading states

## November 7 compatibility

New source-request, intake, reference-link and removal controls preserve the existing 400 ms minimum resource skeleton behavior. Dashboard routes remain skeleton-only; the PESO logo loader is limited to public/authentication loading and sign-in. Delete countdowns are a separate deliberate five-second confirmation requirement, not a resource-loading delay. See [current workspace update](WORKSPACE-UPDATE-2026-11-07.md).

Only home, login (including staff login), and registration route transitions show the PESO logo loader. Submitting sign-in also shows it until authentication and the handoff finish. Workspace navigation, initial session restoration and lazy modules use destination-specific skeletons plus matching sidebar/mobile navigation skeletons; the workspace shell is never covered by a logo loader. Data skeletons retain the 400 ms minimum and remain until the request settles.

Pending page data uses the matching layout in `src/platform/LoadingStates.jsx`. Placeholders remain until the real request settles; an error replaces them with the existing recovery UI. Search inputs stay mounted during result loading, and superseded requests are aborted and ignored. Motion respects device and application preferences.

| Surface | Structure represented |
| --- | --- |
| Home, login, registration and active sign-in | PESO logo and loading indicator; no generic card skeleton |
| Workspace session restoration and lazy navigation | Sidebar, identity header and destination-page skeleton; no PESO loading overlay |
| Sidebar and mobile navigation | Role-specific icon/text rows, branding/footer placeholders and five mobile tabs; restored when private page requests settle |
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

`WorkspaceLoadingProvider` tracks private page resources, including the manually loaded profile/résumé sections. The sidebar and mobile tabs use the same pending lifetime as the content (minimum 400 ms, and longer while the request remains unfinished). Public source-coverage requests keep their local fallback without locking workspace navigation. Role-known sidebar skeletons use the actual visible navigation count; initial session restoration shows anonymous placeholders until identity is resolved. A failed request restores the menu alongside the existing error/retry state; cancelled/unmounted resources release their loading registration. Mobile drawers retain a Close control while their menu is a skeleton.

The full workspace guide waits for route/data loading before enabling Next and positioning its spotlight. It does not substitute a logo overlay on dashboard routes. See `tests/platform/workspace-guide.spec.js` for sidebar/mobile failure recovery and the role-specific guide journeys.
