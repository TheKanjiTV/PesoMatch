# PESO Bansud workspace update — November 7, 2026

This revision connects researched source catalogs to local PESO service requests, synchronizes browser tabs, adds protected removal controls and replaces the previous monochrome dark theme. The requested operating context is PESO Bansud, Oriental Mindoro. This does not establish government adoption, an agency API connection, or an external employer/provider partnership.

## One browser session across tabs

Tabs on the same origin and browser profile share the Laravel session cookie. Opening `/` or a sign-in page while authenticated opens the appropriate role workspace. The explicit Public home action uses `/?public=1` to keep the public portal available. Different browser profiles/private windows do not share a session, and `localhost` and `127.0.0.1` are different origins.

Login/logout announcements use BroadcastChannel and a storage-event fallback containing a change nonce only, never account details, credentials or a client-selected role. Tabs recheck `/api/auth/user` on announcements, focus and becoming visible. The server response is the authority. Identity/role changes remount private route content, clear pending-read sharing and display an account-change explanation. Authentication requests suppress competing focus refreshes. Tutorial replay changes only a preference and cannot log in, select a role or replace an account.

Private API requests include `X-Peso-User` with the account shown in that tab. A mismatch with the authenticated server session returns `409 SESSION_CHANGED`, refreshes the tab and prevents a stale tab from acting as the newly signed-in account. The header does not grant access; normal authentication, role and ownership checks still apply.

## Applying and requesting training inside PesoMatch

### Source-listed vacancies

1. A jobseeker completes their profile, opens a vacancy or a match and chooses **Apply through PESO · request referral**.
2. The system creates a local `requested` referral, prevents duplicates and opens `/referrals`. This is an application-facilitation request to PESO, not an automatic submission to an external employer.
3. Before moving an external listing to `referred`, PESO must record employer contact/verification date, current availability and application instructions in the source-confirmation field. The server records the evidence, officer and timestamp in the referral snapshot.
4. The existing interview → offer → PESO-verified employment start → placement → outcome/follow-up workflow continues. External placement requires the recorded source verification and an actual offer/start evidence. Unknown source slot counts are not invented.

Official-source links are supporting evidence. They are no longer the only available application action. Stale, unpublished, expired or deleted vacancies reject new requests. A source listing is not an illustrative sample, and source review is not a promise of remaining positions.

### TESDA and other source programs

1. The jobseeker reviews the program, accepts the existing enrollment notice and chooses **Request enrollment through PESO**.
2. A local `requested` enrollment is created and `/enrollments` opens. Registry presence alone never confirms admission, a scholarship or a free course.
3. On a source-program detail, PESO uses **Create verified local intake**. Required information is the actual provider, location, mode, capacity, dates, schedule, fee and provider-verification evidence, including any scholarship conditions.
4. The system creates a separate published local program linked through `source_program_id`. It preserves the original registry record and unknown fee/capacity. Source refreshes do not overwrite this local intake. Internal verification notes are omitted from public program JSON.
5. In the pending enrollment's **Update status** form, PESO selects that exact source program's verified local intake before confirming. The request moves to the intake; capacity is checked under transaction locks. It cannot be confirmed against an unrelated, expired, unverified, unpublished or full intake.
6. The existing confirmed → in progress → completed flow remains. A provider completion reference is not a TESDA National Certificate. The platform does not collect training payments or allocate scholarships.

Providers and employers remain scoped to their own connected records. PESO handles source coordination where there is no connected external partner account. Staff must record real confirmation before approving an intake/referral; the application does not fabricate that evidence.

## Delete controls

Vacancies, training records, eligible enrollment requests and other users in Account Access have a named confirmation dialog. Cancel receives initial focus; Escape cancels while idle. A server-issued encrypted confirmation token is bound to the actor, target type/ID and session nonce. It unlocks after **five seconds**, expires after five minutes and is consumed by deletion. The API rechecks permissions and state. A forged token, changed target, early confirmation or expired intent is rejected.

- Catalog deletion uses soft deletion. Items disappear from browse/matching and reject new requests; historical referrals/enrollments retain the related title and evidence. Imports preserve the deletion rather than recreating the source identity.
- Jobseekers can remove their own unfinished enrollment requests; an active request is withdrawn before removal. Staff/providers can remove withdrawn/rejected requests within their authorized scope. Completed training remains history. Removal does not remove the Training Enrollment module.
- Account Access deletion requires an administrator's current password, revokes the target's sessions and removes the account/private résumé and linked personal records using existing erasure relationships. Self-deletion is handled in Account Settings; the current account cannot be deleted through Account Access. Last-administrator protection remains. No real account was deleted as part of this implementation.

## UI details and reports

Light Mode retains its ivory/sage/white surfaces, typography, spacing and layout. Existing `peso-appearance` persistence and `hc1`/`hc2` keys remain compatible. Dark Mode uses background `#18191A`, sidebar/header/cards `#242526`, hover/active `#3A3B3C`, borders `#3E4042`, text `#E4E6EB` and secondary text `#B0B3B8`, with readable green brand accents.

The readability follow-up keeps semantic distinctions with less saturation: primary/add/save actions use deep PESO green (`#123D35` light, `#245C47` dark) and white labels, view/cancel actions use neutral surfaces (`#E9EDF0` light, `#3A3B3C` dark), and delete actions use muted wine red (`#9F2F46` light, `#8F2C40` dark) with white labels. Hover states stay in the same family. This replaces the earlier bright green/blue/red fills with dark labels. Dark headings and primary-colored text are white; the existing charcoal surfaces, Light Mode layout, preference persistence, status badges and highlighted notes are preserved.

Dropdown prompts are disabled/hidden placeholders. Once a valid option is chosen, the prompt cannot be selected as data; required selection still receives native validation. “All” remains a real filter choice. Latest notes and interview schedules use bold, themed emphasis. Events accept an optional **Organizer / link display name** paired with a validated public HTTPS URL. Links open with `noopener noreferrer`; a staff-entered reference does not acquire an invented official review date.

Labor-market copy distinguishes official-source records, connected partner demand and illustrative samples. Unknown external position counts are not estimated, and platform activity is not presented as a municipal/national unemployment rate.

The placement workflow example was removed at the user's request. Empty Placements now shows a short empty state and a link to referrals, where PESO can record a placement after an employer offer and actual employment-start evidence. No real placement was inserted: the read-only follow-up found zero placements and zero offered referrals. An existing verified employment-outcome report was not treated as an employer offer or assigned an invented start date. A genuine record requires an authorized jobseeker, actual employer/position, start date, employment type and PESO offer/start verification. Those facts were not invented or inserted during this revision.

## Database and verification

The additive migration `2026_11_07_000001_add_facilitation_intakes_and_catalog_removal.php` adds soft-delete timestamps to vacancies/programs/enrollments, source-program linkage and intake evidence, and event reference fields. It was applied with a temporary local deployment connection after a private consistent backup. The runtime `.env`, application key and CRUD-only database identity were preserved.

Before/after counts were identical: 13 users, one referral, one enrollment, zero real placements, one outcome, 3,199 vacancy rows and 22,089 training rows including existing samples. No existing request was converted, approved or deleted during implementation. PHPUnit uses SQLite `:memory:`; browser fixtures use intercepted responses and are not persisted to MySQL.

Current verification results are maintained in [VERIFICATION.md](VERIFICATION.md). See [API.md](API.md) for exact request contracts and [NATIONAL-CATALOG-2026-11-06.md](NATIONAL-CATALOG-2026-11-06.md) for the dated source-review snapshot.
