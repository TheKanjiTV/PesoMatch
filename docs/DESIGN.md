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

Service pages enter with a short, visible-by-default movement; account navigation retains its directional transition. Dialog/tutorial steps and expandable details have bounded entrances. Reduced motion disables these transitions. First-time users receive a role-specific guide with Next, Previous, Skip, Close and Settings replay.

Mobile uses a persistent five-item bottom navigation, a full service drawer with animated opening and closing, solid sticky header, wrapping records and locally scrollable report tables. The overview pathway collapses on phones to keep practical actions near the top. Active checks cover both themes, large text, profiling, mobile overflow and Axe WCAG A/AA assertions.

## Brand and application

The restored open P mark uses a single stroke without a surrounding box. It is used in the shared brand, profile wizard, favicon, PWA icons and Android launcher. It is not an official government seal.

The install page explains Android browser, iPhone/iPad and desktop installation and offers the local Android APK when built. PWA caching is restricted to static assets and an offline information page; API/auth responses and personal records are excluded. The Android app uses the same responsive role-specific interface and Laravel account, plus native platform setup, Back navigation and CSV file export. See MOBILE-APP.md for runtime and release limits.


## Résumé and source evidence

Résumé review shows suggested skills beside their extracted evidence and preserves existing profile skills. Program cards distinguish registered programs, online courses, overseas announcements and verified local intakes. Source/checked dates remain visible; the primary action submits a local PESO enrollment request and the source link supports review. Every recommended vacancy can list training that addresses its own missing skills; the interface never promises hiring after a course. Staff/partner sign-in has its own entry and explanatory copy while using the same role-authorized account backend.


## November 7 charcoal and semantic system

Light Mode retains the current ivory background, sage sidebar, white cards, Lora/Public Sans typography, spacing and layout. Dark `hc2` uses `#18191A` background; `#242526` sidebar/header/cards; `#3A3B3C` hover/active surfaces; `#3E4042` dividers; `#E4E6EB` primary text and `#B0B3B8` secondary text. The prior pure black/white overrides are retired. The existing `peso-appearance` preference persists and restores the theme.

Semantic action bases are green `#31A24C`, amber `#F7B928`, red `#F02849`, blue `#0084FF` and gray `#B0B3B8`. Accessible dark ink is used on bright action fills; status badges use theme-specific surface/ink pairs, explicit labels and readable contrast. Green remains the brand. Add/save, delete/reject, view/information and cancel actions have consistent meaningful treatments. Notes and interview schedules use bold themed emphasis. Named delete dialogs protect focus with Cancel first and a server-enforced five-second wait. Dropdown prompts are disabled/hidden, with valid “All” filter choices retained. See [current interaction contract](WORKSPACE-UPDATE-2026-11-07.md).
