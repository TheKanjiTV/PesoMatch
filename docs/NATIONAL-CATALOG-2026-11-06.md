# Nationwide official-source catalog review — November 6, 2026

The catalog now contains **498 reviewed PESO/government vacancy references** and **22,086 training records**. This is a public-source review, not a live integration, a confirmation from every office, or complete coverage of every Philippine PESO. A reachable official page does not prove a remaining vacancy. No applications, agency inquiries, account registrations or messages were submitted during research.

## Vacancy coverage

| Official source | Records | Availability evidence |
| --- | ---: | --- |
| [Pasay City PESO](https://pasay.gov.ph/job-openings/) | 347 | Individual application pages reviewed; no remaining-slot or closing-date confirmation |
| [Negros Occidental PESO](https://www.negros-occ.gov.ph/negros-jobs/) | 54 | Public detail pages list openings and unexpired deadlines |
| [Camarines Sur PESO](https://www.camarinessur.gov.ph/announcement/177) | 3 | Recruitment announcements; each multi-role announcement remains one record |
| [Oriental Mindoro provincial careers](https://ormindoro.gov.ph/careers/) | 7 | Official government HR postings with November 8, 2026 deadlines |
| [Iloilo PESO / CFO BaLinkBayan](https://iloiloprovince.balinkbayan.gov.ph/available-job-opportunities) | 87 | Role references, including 14 overseas roles; no confirmed closing date, work site/country, pay or remaining places |
| **Total** | **498** | **61 source-listed open; 437 require current-availability confirmation** |

“Source-listed open” requires a recognized deadline-bearing source, a review within seven days and an unexpired deadline. It is not a guarantee that the employer still has unfilled positions. A known past deadline excludes a record from public browse/matching immediately; an external record without a refreshed review expires after 30 days. Staff can inspect retained source history with its actual status.

The Negros portal advertises 60 jobs. Alphabetical public searches exposed 54 distinct detail pages that met the checks; this review does not claim the inaccessible six. The Oriental Mindoro entries are government HR jobs, not connected PESO employer submissions. Plantilla item numbers are retained as evidence, not converted into available slot counts. Iloilo's overseas references do not establish an agency's current DMW license or approved job order; applicants must verify those with DMW/PESO.

### Priority locations and coverage gaps

- **Oriental Mindoro:** seven government vacancy postings plus 427 registered training records whose official institution/qualification/address description mentions the province.
- **Occidental Mindoro:** 103 matching registered training records. The provincial PESO host could not be resolved and the San Jose official site returned 403 in both a regular HTTP request and an anonymous browser. An indexed recruitment announcement was not imported because current details and an expired preregistration window could not be reconciled.
- **Palawan:** 128 matching registered training records. The [provincial careers table](https://palawan.gov.ph/career/) shows 2023 government deadlines and August 2024 private listings marked Open; their current availability was not confirmed, so no current vacancy was inferred.
- **Puerto Princesa:** 96 matching registered training records. The [official City PESO contact directory](https://puertoprincesa.ph/city-government-contacts/) is provided for current local vacancies. The public HR page does not supply a verified current vacancy feed.

These training location counts can overlap and are descriptive search matches, not counts of open cohorts. Palawan and Puerto Princesa should not be summed as disjoint regions.

Additional public boards were checked: Cebu displayed zero available jobs; WorkIN Ilocos Norte returned no recent vacancies; Mati contained incomplete/stale, duplicate and test-only entries; Cauayan's public listing required sign-in for details; Bulacan returned a server error. None of these conditions is evidence that the area has no jobs. The official DOLE VIII-endorsed HIRE-EV hub is linked as a directory only; its aggregated commercial/retired-provider listings were not relabeled as verified PESO vacancies. DMW's public approved-order feed was inaccessible to this review. No access restriction was bypassed and no unverified job orders were imported.

The removed PhilJobNet provider stays excluded from active browse, matching and imports. Existing database rows remain for historical bookmarks and foreign-key relationships.

## Training coverage

| Source | Records | Meaning |
| --- | ---: | --- |
| [TESDA registered-program directory](https://www.tesda.gov.ph/Tvi/Result) | 21,855 | Institution/qualification records; current intake, scholarship, schedule, mode and fees are unconfirmed |
| [TESDA Online Program](https://e-tesda.gov.ph/) | 230 | Official online course records with their original review timestamps; remote access is not a physical overseas center |
| [MWO Osaka / TESDA NLSC announcement](https://mwo-osaka.dmw.gov.ph/2026/09/26/free-jlpt-n3-examination-preparation-training-program/) | 1 | JLPT N3 preparation announced for eligible OFWs in western/central Japan; reconfirm registration and remaining places |
| **Total** | **22,086** | **Training records, not 22,086 confirmed open enrollment intakes** |

All **746 observed TESDA registry pages** were collected with normal TLS verification, two workers, bounded timeouts/retries and per-page receipts. No page was missing from this snapshot. Complete records were deduplicated by their official institution/qualification/address lookup. Missing fields and overlong source identities were excluded rather than invented. The committed registry is JSONL to keep imports bounded in memory. Each row retains its actual page review timestamp, evidence-page URL and page SHA-256; a later import does not make old evidence fresh.

Nineteen institution/qualification matches were held after comparison with accessible official May, June and August 2026 delisting workbooks linked from the [TESDA closed-program index](https://www.tesda.gov.ph/About/TESDA/40). A matching pair can involve branch or renewal ambiguity, so the hold means office confirmation is needed, not a definitive statement about every branch. Some historical notice links could not be resolved; this is not complete historical closure reconciliation. The hold file is enforced both by the collector and importer.

Registered-program fees serialize as `null` and the UI displays “Not disclosed · confirm with provider,” rather than Free. Dates and capacity stay unknown. No skills or delivery modes are guessed from a qualification title. The overseas record uses only the official announcement's eligibility and stated free fee; its announced maximum participation is not treated as a live remaining-place count. Course completion does not automatically award a TESDA National Certificate.

## Application behavior and preservation

Training filters distinguish registered programs, online courses, overseas training and partner programs. Vacancy filters distinguish source-listed-open records. Search includes the full source institution/qualification/address text, with shortcuts for the four priority areas, keyboard navigation and normal pagination. The source coverage panel exposes the actual office limits, including places without a verified current public vacancy. Existing dashboard skeleton loading and public/sign-in logo-loading behavior are preserved.

Matching scores and the content-based method are unchanged. The matcher indexes lightweight program IDs/topics, hydrates returned records only, returns up to 100 training suggestions and up to eight related programs per vacancy, and reports the full training total. The complete searchable training catalog remains paginated; the suggestion limit does not remove registry records.

Imports update by source identity inside transactions, reject unapproved destination patterns and refuse to overwrite an employer/provider-owned record. A complete reviewed snapshot can unpublish a withdrawn external source record without deleting it. Account, enrollment, referral, bookmark, placement and outcome relationships are preserved. No users, employers, partner relationships, enrollments or outcomes were fabricated. The local account count stayed at 13 throughout this import.

## Reproduce a reviewed refresh

Install Python 3 and `beautifulsoup4` for the Python collectors. Node collectors use the existing Playwright dependency and an installed Edge browser. Run from the repository root:

```powershell
python scripts/refresh-peso-vacancies.py --write
python scripts/collect-regional-peso-vacancies.py --write
node scripts/collect-iloilo-peso.mjs
python scripts/collect-tesda-registry.py --write
```

Collectors read only public pages, preserve other source families when merging, and keep detailed receipts under ignored `.local/nationwide-review/`. The TESDA collector resumes same-day cached pages using their original timestamps and refuses to overwrite the catalog if any page failed. The static coverage report and delisting holds must be reviewed alongside any new snapshot; a successful fetch is not renewed intake/availability confirmation. Oriental Mindoro's seven careers-table rows, the three Camarines Sur announcements and the Osaka announcement were manually curated against their public official pages in this review. Recheck these pages before updating those records or their timestamps. Canonical vacancy data is `verified-vacancies.json`; the per-source files are review snapshots. Do not import a single provider snapshot as if it were the complete canonical dataset.

From `backend/`:

```powershell
php artisan peso:import-verified-vacancies
php artisan peso:import-verified-training
```

Training can also be refreshed separately with `--catalog=online`, `--catalog=registered` or `--catalog=international`. These commands import committed evidence and do not scrape or confirm availability at runtime. No migration or reseeding is required for this change.

## Verification

- Production build passed. The existing lazy Three.js chunk-size warning remains; no build failure occurred.
- Full backend suite: 84 tests passed, 5,673 assertions. After the final external-program edit guard, the six national-catalog tests passed again with 46 assertions.
- Seven focused browser checks passed: four loading-layout tests, two national-training semantics/filter tests and the official-vacancy source/accessibility test. Desktop/mobile screenshots were visually reviewed. These checks cover dashboard skeleton-only behavior and the separate public/sign-in logo loader.
- Final imports were idempotent: 498 vacancy and 22,086 training records, with zero training records retired on the repeat import. Read-only live checks verified 13 accounts, 498 browsable source vacancies, 21,855 registered programs, 230 TOP courses and one overseas announcement. The 2,697 retired-provider rows and four local sample/partner rows remained intact.
- Matching on the actual 22,086-record training directory and 498 source vacancies completed in 1.369 seconds with a 70 MB PHP peak in the local CLI check. This is a local measurement, not a production latency guarantee.
- Live public catalog and source-coverage endpoints responded successfully. Registry fees serialized as null. Python collector syntax checks and Node collector/link-check syntax checks passed.
- The local secret inventory found no matching token/private-key patterns in tracked working files or Git history, and no current environment-secret matches in built assets or application logs. This is a bounded automated check, not a full security certification.

Browser fixtures remain isolated to intercepted responses and SQLite tests; they are not real accounts or persisted catalog records. Generated screenshots, raw pages and private database/security receipts remain excluded from GitHub.
