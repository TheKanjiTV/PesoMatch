# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Design

## Direction

The latest user revision restores the quieter civic workspace: warm ivory background, light sage sidebar, white working cards, Lora page headings and Public Sans body text. Strong text contrast and semantic status colors remain. Dark mode uses Messenger-inspired layered charcoal surfaces with green brand accents, readable light text and semantic action colors. Fonts are local and licensed.

The public focal scene is an authored Three.js career folio: a linen-green case folder with profile, skills and employment papers. Pages change depth and position to show one continuing record across PESO services. The scene sits directly on the page background with no enclosing box, captions or stage controls. Only pause/play and reset controls remain, with reduced-motion support and a non-WebGL fallback. It suspends offscreen or when the document is hidden. No toy buildings, floating islands or invented impact statistics.

A single sun/moon icon changes light/dark mode. The larger-text on/off switch appears only in Account Settings. Both preferences persist on the device. The user's name and role appear in the top navigation, outside the sidebar menu. The restored open P mark has no enclosing box and is shared by public and account screens, the favicon and application assets. The install hero uses an authored, compact Three.js phone with rounded hardware, a notch, side buttons and an illustrative PESO screen. The phone is the only moving object in that scene; no floating labels or surrounding props are added. Its stage is at most 480 pixels tall and 440 pixels on narrow screens.

Impeccable source guidance informed this refinement. Its context launcher exited 1 without output; no CLI verification is claimed. The user explicitly requested the earlier dashboard direction and delegated the replacement 3D concept.

## Opportunity browsing

Two-column vacancy/program catalogs become single-column on mobile. Details separate substantive requirements from practical application/enrollment information. Record-level sample badges stay visible. Matching shows actual declared skill overlap, missing declared skills, the method and its limits.

Lifecycle pages use record summaries and explicit next-status forms. Provider/PESO status transitions are validated by Laravel; jobseekers can withdraw only their own active requests. Placement requires a recorded offer and verification evidence. Outcome reports show whether PESO has verified them.

## Motion and accessibility

A light sage sidebar, editorial headings and quiet white counters support repetitive casework. Readable body text and colored semantic badges preserve hierarchy. HC1/HC2 and larger text are preferences stored locally; no personal record is stored with them. Existing profile forms preserve saved-step behavior. Controls have visible labels, minimum touch targets, native form semantics, focus indicators, themed selection/caret/scrollbars and useful loading/error/empty states.

Sign-in and registration enter from the right; Back to Home enters from the left through browser View Transitions. Reduced-motion users receive immediate account navigation and a static 3D composition. The scene pauses when hidden/offscreen; WebGL failure retains a text pathway fallback. No decorative scene runs in the workspace. The 3D module is loaded separately from the operating interface.

Service pages enter with a short, visible-by-default movement; account navigation retains its directional transition. Dialog/tutorial steps and expandable details have bounded entrances. Reduced motion disables these transitions. First-time users receive a role-specific guide that visits the real modules across the workspace, with Next, Previous, Skip, Close and Settings replay. It includes jobseeker vacancies, matching, referrals, training and enrollment, plus the remaining authorized services; staff/partners see only their permitted pages. Next waits for route/data loading and the spotlight follows the current page. Finish returns to Overview. The guide does not submit applications or modify service records.

Mobile uses a persistent five-item bottom navigation, a full service drawer with animated opening and closing, solid sticky header, wrapping records and locally scrollable report tables. The overview pathway collapses on phones to keep practical actions near the top. Active checks cover both themes, large text, profiling, mobile overflow and Axe WCAG A/AA assertions.

## Brand and application

The restored open P mark uses a single stroke without a surrounding box. It is used in the shared brand, profile wizard, favicon, PWA icons and Android launcher. It is not an official government seal.

The install page explains Android browser, iPhone/iPad and desktop installation and offers the local Android APK when built. PWA caching is restricted to static assets and an offline information page; API/auth responses and personal records are excluded. The Android app uses the same responsive role-specific interface and Laravel account, plus native platform setup, Back navigation and CSV file export. See MOBILE-APP.md for runtime and release limits.


## Résumé and source evidence

Résumé review shows suggested skills beside their extracted evidence and preserves existing profile skills. Program cards distinguish registered programs, online courses, overseas announcements and verified local intakes. Source/checked dates remain visible; the primary action submits a local PESO enrollment request and the source link supports review. Every recommended vacancy can list training that addresses its own missing skills; the interface never promises hiring after a course. Staff/partner sign-in has its own entry and explanatory copy while using the same role-authorized account backend.


## November 7 charcoal and semantic system

Light Mode retains the current ivory background, sage sidebar, white cards, Lora/Public Sans typography, spacing and layout. Dark `hc2` uses `#18191A` background; `#242526` sidebar/header/cards; `#3A3B3C` hover/active surfaces; `#3E4042` dividers; `#E4E6EB` primary text and `#B0B3B8` secondary text. The prior pure black/white overrides are retired. The existing `peso-appearance` preference persists and restores the theme.

The latest readability revision uses the existing **Explore my matches** action as the primary reference. Add/save/primary actions use deep PESO green with white labels; detail/cancel actions use a quiet neutral fill and readable text; destructive actions use a muted wine-red fill with white labels. The neon green/blue/red fills with dark labels are retired. Buttons share a restrained 600 weight and consistent existing spacing/radii. Status badges keep their semantic tones and explicit text labels.

Dark-mode primary-colored headings and related text are now white (`#FFFFFF`) instead of mint. Charcoal page/card surfaces remain unchanged. Button surfaces have independent tokens so white heading text cannot create washed-out controls. Notes and interview schedules retain their highlighted emphasis. Named delete dialogs retain Cancel-first focus and the five-second server-enforced wait. Dropdown prompts remain disabled/hidden. See [current interaction contract](WORKSPACE-UPDATE-2026-11-07.md).


Initial workspace/session loading uses matching sidebar icon/text/footer rows, mobile tabs and the full identity/action header skeleton. The header covers name/role, appearance, Install and Public home, with compact mobile visibility matching the actual controls. Once the shell is ready, it stays usable during module changes, searches and retries; only pending content uses its existing layout skeleton and 400 ms minimum. Initial errors restore navigation alongside recovery controls; mobile drawers retain Close. Training Enrollment keeps **Withdraw request** for active own requests and removes the redundant **Delete enrollment request** action; completed/terminal history remains visible.


## November 25 workspace refinement

Operate mode retains the civic visual identity. Vacancy Management includes matching percentages; the separate Job Matching and Labor Market Information modules are removed from navigation and old bookmarks redirect. Count-vector cosine supplies local relevance; explicit AI consent enables semantic embedding cosine scores. Provider/model identifiers are absent from product controls and results.

Training topic requests use four actual form steps: Topic, Dates, Preferences, Review. Back retains entered values. The final submission persists the request and its preferred schedule, mode, location and goal. Catalog requests prefill this same wizard.

Interview outcomes appear inside the associated referral only when staff enable the option after its interview time. Interview decisions do not create employment placements. Settings and Overview expose tutorial replay only to administrators; new users still receive the first-run guide.

AI consent uses a compact 600px native dialog with readable sharing information, an explicit consent control, response language, privacy link and Done action. The profile shows saved work entries first and extracted résumé work evidence when no structured entries exist. Repeated explanatory source panels, privacy-request sections and the résumé experience/certificate add controls are retired.


## November 25 presentation follow-up

Vacancy cards and details place a large, borderless match percentage at the right of their heading. The mobile navigation places Vacancy Management in the raised center circle for every role, while keeping role-specific services on either side.

Training topic requests open an 880px native modal with four connected progress markers. Completed steps show checks; the current step has an outlined marker; each step retains Topic, Dates, Details and Review content and validation. Back preserves entered values and closing restores focus to the opener. Privacy links open the full notice in a reading dialog without navigating away or changing registration consent. Direct privacy URLs also open the dialog. Nested Escape closes only the top dialog.

Update notifications use a quiet card with a refresh icon, a short heading and distinct Later / Reload app controls above the mobile navigation. Requested module descriptions and account-history explanations are removed without changing their underlying workflows or records.


## November 25 archive usability follow-up

Permanent deletion uses a short dialog heading, the full record title and requester as a readable summary, a required acknowledgement checkbox, administrator password and server-enforced five-second wait. The disabled action has a nearby explanation for the current missing requirement. Expired confirmations can be reviewed in place. The former long title-entry field is removed to prevent password managers from filling it as a username.

Staff Training Demand retains topic grouping and counts, with full-width expanded requests. Archive request belongs to each person's row; archiving one person keeps the other requests visible and updates the interest count. No bulk topic archive control or API remains. AI Career setup keeps the existing tool controls within a readable 1024px measure, uses an explicit assistance switch, and explains whether consent or a vacancy is needed before generation.
