# Loading states

Only home, login (including staff login), and registration route transitions show the PESO logo loader. Submitting sign-in also shows it until authentication and the handoff finish. Workspace navigation, initial session restoration and lazy modules use destination-specific skeletons; the workspace shell is never covered by a logo loader. Data skeletons retain the 400 ms minimum and remain until the request settles.

Pending page data uses the matching layout in `src/platform/LoadingStates.jsx`. Placeholders remain until the real request settles; an error replaces them with the existing recovery UI. Search inputs stay mounted during result loading, and superseded requests are aborted and ignored. Motion respects device and application preferences.

| Surface | Structure represented |
| --- | --- |
| Home, login, registration and active sign-in | PESO logo and loading indicator; no generic card skeleton |
| Workspace session restoration and lazy navigation | Destination-specific skeleton; no PESO loading overlay |
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
