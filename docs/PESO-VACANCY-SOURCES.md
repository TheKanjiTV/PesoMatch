# Official PESO vacancy sources — November 6, 2026

This is the first Pasay-only replacement snapshot. See the later [nationwide catalog review](NATIONAL-CATALOG-2026-11-06.md) for current coverage and totals.

The user requested removal of the inaccessible PhilJobNet provider. Active vacancies now use the [Pasay City PESO job board](https://pasay.gov.ph/job-openings/) and its individual `/peso-jobs/` application pages. The site is hosted on the official city government domain. Its public WordPress catalog API is used only to enumerate published listing identities; each included detail page is fetched and checked separately.

## Coverage and verification

The review included 347 detail-verified records from 349 recent PESO candidates across four public API pages; two detail layouts were excluded for manual review. The exact exclusions, collection date and scope are in `backend/database/data/verified-peso-vacancy-coverage.json`. The collector considers PESO-category postings from the preceding 30 days, excludes separate city-government plantilla postings, and requires a matching title, posted date, employer, qualifications and the official PESO application form. This collection covers the Pasay PESO board, not all Philippine vacancies. A page being reachable does not establish that its position is still unfilled.

Qualification summaries come from each source page. The detail template has no dedicated work-site field. Some qualification text names a location; that text is retained, and location conditions are searchable. The location label asks applicants to confirm the work site, because Pasay is the posting office's jurisdiction. Explicit project-based and full-time/part-time terms are preserved; other arrangements point to the source qualifications. Salary, deadline and slot count remain unknown. No skills are inferred from titles and no age criteria are used to rank applicants. Users open the official detail/application page and review its own notice; PesoMatch does not submit that form or transmit a profile.

## Refresh and import

1. Run `python scripts/refresh-peso-vacancies.py` for a review without replacing the dataset, or add `--write` to replace the reviewed JSON files.
2. Inspect the public coverage report and local receipts under `.local/peso-vacancy-review-*/`.
3. Run `php artisan peso:import-verified-vacancies` from `backend/`. The command validates exact HTTPS official detail URL patterns and updates by source URL in a transaction. It creates no accounts, applications, referrals or outcomes.

The collector uses two bounded anonymous GET workers, normal TLS validation, fixed source hosts and restricted redirects. It neither reads account cookies nor submits forms. Private form fields, tokens and submitted information are not included in the committed dataset or receipts. Empty or duplicate collections do not overwrite the existing data. Details with conflicting identity, malformed fields or missing application instructions are excluded and reported.

Source records leave browse and matching after 30 days without review, or sooner when a known deadline passes. Refresh is an explicit review/import operation, not an automatic live feed. Older historical records cannot be relabeled freshly checked by rerunning an old collector.

## Retired provider and account preservation

PhilJobNet is no longer an active import, application link, help contact or network-status dependency. Its old status endpoint and browser polling have been removed. Existing imported database rows and their original provenance remain intact to preserve bookmark and workflow foreign keys. `Vacancy::currentSource()` excludes the retired host from staff/admin browse, public catalogs, matching and new bookmarks. Retired jobs are not falsely marked closed, and an existing bookmark can still be removed. Local employer-owned vacancy management remains available.

Earlier source reports and Git history are historical evidence. Their old nationwide totals do not describe the replacement PESO collection. Legacy vacancy curators refuse to overwrite the current data.

## Validation

Backend coverage checks importer idempotency, exact official destinations, explicit unknown values, stale-record expiry, retirement across catalog roles and matching, preserved history, and removal of a retired bookmark. Browser coverage checks official links, source dates, coverage wording, absence of old portal polling, keyboard focus, mobile overflow and accessibility. Live collection receipts record HTTP 200, source identity, timestamp and a response hash for every included detail page.
