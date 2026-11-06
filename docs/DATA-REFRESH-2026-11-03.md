# Public-source refresh — November 3, 2026

Historical report: its vacancy provider was retired on November 6, 2026. See [current PESO vacancy sources](PESO-VACANCY-SOURCES.md); these earlier vacancy totals are not current browse totals.

Requested posting/event window: **October 14–November 3, 2026, inclusive**. This adds public opportunity records to the existing Laragon app. No people, applications, messages, referrals, enrollment, placements or employment outcomes are fabricated.

## Catalog totals

| Data | Added | Retained source catalog |
| --- | ---: | ---: |
| PhilJobNet job listings | 2,677 | 2,697 |
| TESDA courses | 196 | 230 |
| Regional job-fair events | 10 | 14 |
| PSA statistical report | Rechecked | 1 report / four indicators |

The sweep verified **413 public listing pages**, with 446 page receipts and 4,121 distinct listing identities observed across the mutable source. Of 2,678 candidates posted within the requested 21-day window, one was excluded: listing `1488811` had a title/employer in the list but its detail page returned “Position not specified” and “Company name not specified.” All 2,677 retained additions have checked detail evidence. The 20 earlier jobs are preserved. There are 513 new listings without a mapped skill topic; this stays explicit rather than inventing requirements.

Daily counts, exact source coverage, check times and the excluded URL are recorded in [the machine-readable coverage manifest](../backend/database/data/verified-source-coverage.json).

## Sources

| Catalog | Review and interpretation |
| --- | --- |
| Vacancies | [PhilJobNet](https://philjobnet.gov.ph/job-vacancies/). Follow public Last/numbered links and verify the full observed page range. Older listing IDs sometimes have newer posting dates, so the first older page alone is insufficient. Detail pages support title, employer, posted date, industry and skill-topic evidence. Distinct source URLs remain distinct postings. |
| Training | [TESDA category tree](https://e-tesda.gov.ph/course/index.php?perpage=1000): 84 reachable category pages, 230 course URLs; all 34 earlier courses found again. No course publication dates are disclosed: these are checked on November 3, not necessarily created since October 14. Provider login, audience restrictions and prerequisites apply. |
| Events | [DOLE XI calendar](https://ro11.dole.gov.ph/job-fair-schedules/) and [DOLE CAR calendar](https://docs.google.com/spreadsheets/d/1PlMXkd0LkWnWD640JrIprx7DGjleu5U4-9wD_UNIQys/edit), grounded in the [PhilJobNet regional directory](https://philjobnet.gov.ph/page/1/schedule-of-job-fairs). Eight XI entries and two CAR events added to four existing records. |
| Statistics | [PSA OpenSTAT](https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__1B__LFS/0021B3FKEI2.px/) and its anonymous API rechecked. Latest available period remains **August 2026**: participation 64.016%, employment 94.731%, unemployment 5.269%, underemployment 11.859%. No later estimates invented. National survey figures remain separate from platform outcomes. |

Descriptions are authored summaries/instructions, rather than full advertisement or lesson copies. Skill tags are conservative authored topic mappings from listing text or course title/category. They do not prove proficiency, complete requirements, qualification equivalence or endorsement. An empty mapping now directs users to the official qualifications. Industry lists exceeding the existing field length remain in the description; the bounded field reads “Multiple source-listed sectors.”

Unknown deadlines, vacancy counts and salary periods stay unknown. Zero-valued source salary entries are treated as unspecified, not evidence of unpaid work. A reachable listing does not establish that an opening remains unfilled. The 30-day source freshness safeguard remains. Earlier records retain their previous check dates unless rechecked.

Source check timestamps preserve their original instant: importers convert UTC/offset input to the application's Asia/Manila timezone before database storage, while source badges display the timestamp in Manila time. Date-only posting/event dates retain their original calendar date. Browser verification exposed and corrected the earlier eight-hour import shift and UTC-date truncation.

## Event review and coverage limits

CAR's two Tayum entries on October 22 were merged into one event. Trabahong Digital's October 27–28 range is stated in its description; `event_date` records its first day without inventing opening hours. The Joji Ilagan entry preserves and explains the source's October 23 schedule versus its `1029` permit reference. Past scheduled dates do not establish actual conduct, attendance or hiring results.

The regional event review is not an exhaustive national calendar. DOLE XI direct requests returned 403; official indexed calendar evidence was reviewed and recorded in each event's verification method. Directory-linked Region 1/10 workbooks contained 2025 schedules; Region 7's visible 2026 entries were in January. They were not relabeled as October 2026. Region 2 access failed; several other regional sites returned 403/502 or unusable redirects. No events were invented for inaccessible sources.

Public job pagination changes during collection. Coverage means accessible public records observed in this review, not a historical archive of deleted/private posts or every vacancy on the internet. Applications continue on the source website.

## Evidence and import

Reviewed records live in `backend/database/data/verified-*.json`. Raw anonymous pages, request receipts, SHA-256 hashes, regional calendar text and private database/catalog backups stay under ignored `.local/source-review/2026-11-03/`.

Research helpers only produce review candidates/evidence:

```powershell
python -m pip install --target .local/catalog-python beautifulsoup4==4.14.3
python scripts/refresh-public-catalog.py
python scripts/collect-training-catalog.py
python scripts/fetch-catalog-job-details.py
```

The backward/numbered-page helpers complete the full public-page sweep. Stop collectors before combining receipts with `scripts/finalize-public-catalog-review.py`, then finish detail evidence collection before `python scripts/curate-catalog-refresh.py all`. Review exclusions and source inconsistencies before importing. This is a dated review, not scheduled synchronization.

From `backend/`, imports update by unique source URL/stable event key inside transactions:

```powershell
php artisan peso:import-verified-vacancies
php artisan peso:import-verified-training
php artisan peso:import-verified-public-resources
```

Events accept only the two exact reviewed calendar URLs. No schema migration, application-key or privilege change is required. Existing records and bookmarks are preserved.

Matching computes corpus frequencies once while retaining the 75% skill-coverage / 25% TF-IDF formula. Ranked jobs paginate at 100 through the existing controls. Course suggestions expand for the requested job page; the training tab hides job-page controls.

The large evidence archive exposed a development-server startup problem: Vite's default dependency discovery crawls HTML files. Dependency entries are now restricted to the actual `index.html`, and the watcher ignores `.local` and generated screenshots. This keeps the source archive outside application discovery while retaining it for review. See [Vite's entries documentation](https://vite.dev/config/dep-optimization-options#optimizedeps-entries).

## Final verification

- Production build passed; the existing large Three.js chunk warning remains.
- Full Laravel suite: **66 passed / 25,252 assertions**, isolated SQLite in memory. Includes source idempotence, timestamp-instant preservation, stale/sample exclusion, global matching rank/page coverage and posting-date ordering.
- Targeted Edge/Playwright run: **2 passed**, covering real source catalogs and PSA separation; official links, truthful unknowns, Manila check dates, saved-job persistence, matching page 2, training-tab controls, missing course-topic copy, mobile overflow and the existing vacancy Axe audit. Job and course screenshots were visually reviewed. This is a focused run, not a new full-browser-suite certification.
- Actual Laragon MySQL: **2,697 source jobs, 230 source courses, 14 source events, one PSA report**. Repeated imports create no duplicates. All **2,942** source-record timestamps round-trip to their original input instant.
- All **23 protected account/profile/workflow tables** match their before-import row counts and content hashes. **136 accounts**, the original résumé, sample records, migrations and application key are preserved. There are **33 checked foreign-key relationships, zero orphan references**, with foreign-key checks enabled.
- Initial browser checks exposed the unresponsive development scan and the check-date timezone defect described above. Both were fixed and the two focused scenarios passed afterward. No public deployment, government integration or live vacancy-availability guarantee is claimed.
