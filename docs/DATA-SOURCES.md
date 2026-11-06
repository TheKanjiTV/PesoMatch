# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Data Sources

Current review: [November 6 nationwide catalog, coverage and verification](NATIONAL-CATALOG-2026-11-06.md). The October 10 counts and tables below are historical evidence for the original catalog.

## Nationwide official training catalog

Eighteen real course records were researched and imported on October 10, 2026 from the official TESDA Online Program. Every record includes its official course URL, source name and checked timestamp. The table below reproduces the source identity, not private learner records. Titles were read from official category pages; short descriptions are authored summaries. Skill mappings are authored curriculum interpretations for recommendation, not a TESDA endorsement or qualification equivalence.

TESDA describes TOP as free online courses: [official program description](https://e-tesda.gov.ph/local/staticpage/view.php?page=TOP).

| Course | Official listing | Category evidence |
| --- | --- | --- |
| Fundamentals of Artificial Intelligence | [Course](https://e-tesda.gov.ph/course/view.php?id=5164) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2111) |
| AWS Certified Cloud Practitioner (CLF-C02 - English) | [Course](https://e-tesda.gov.ph/course/view.php?id=5163) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2111) |
| AWS Certified AI Practitioner (AIF-C01 - English) | [Course](https://e-tesda.gov.ph/course/view.php?id=5162) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2111) |
| Introduction to Content Creation | [Course](https://e-tesda.gov.ph/course/view.php?id=4068) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=1789) |
| Creating Concepts for Social Media | [Course](https://e-tesda.gov.ph/course/view.php?id=4069) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=1789) |
| Translating Concepts into Multimedia Contents | [Course](https://e-tesda.gov.ph/course/view.php?id=4079) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=1789) |
| Propagating Content | [Course](https://e-tesda.gov.ph/course/view.php?id=4070) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=1789) |
| Introduction to Digital Marketing | [Course](https://e-tesda.gov.ph/course/view.php?id=4747) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2004) |
| Designing a Digital Marketing Funnel | [Course](https://e-tesda.gov.ph/course/view.php?id=4748) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2004) |
| Designing a Campaign Creative Brief | [Course](https://e-tesda.gov.ph/course/view.php?id=4749) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2004) |
| Creating Content | [Course](https://e-tesda.gov.ph/course/view.php?id=4750) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2004) |
| Optimizing Digital Marketing Campaign | [Course](https://e-tesda.gov.ph/course/view.php?id=4751) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2004) |
| Conducting Data Analysis | [Course](https://e-tesda.gov.ph/course/view.php?id=4752) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=2004) |
| Participating in Workplace Communication | [Course](https://e-tesda.gov.ph/course/view.php?id=56) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=37) |
| Receiving and Responding to Workplace Communication | [Course](https://e-tesda.gov.ph/course/view.php?id=52) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=37) |
| Microsoft Digital Literacy | [Course](https://e-tesda.gov.ph/course/view.php?id=4716) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=1310) |
| Practicing Data Privacy in the Workplace | [Course](https://e-tesda.gov.ph/course/view.php?id=4395) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=1310) |
| Wi-Fi 101 and Digital Thumbprint Program | [Course](https://e-tesda.gov.ph/course/view.php?id=2480) | [Official catalog](https://e-tesda.gov.ph/course/index.php?categoryid=1310) |

## What verification means

“Checked” means the title and source listing were inspected at the recorded time. It is not a promise of future availability, a government API integration, an accreditation of this platform or a reserved training place. Courses open on the official provider website. Self-paced courses use null start/end dates and capacity rather than invented schedules or seat counts. Completion is not an automatic National Certificate. Existing local programs remain separately labeled illustrative samples and use the local enrollment workflow.

Run `php artisan peso:import-verified-training` from backend/ to import/update the committed researched dataset by unique source URL. It is intentionally not an unattended scraper. Recheck the official source before changing the checked timestamp or publishing changed information. No fabricated users, learner progress, referrals, placements or employment outcomes are seeded.

## Reviewed official PESO vacancies

The active vacancy dataset now includes the Pasay, Negros Occidental, Camarines Sur and Iloilo PESO boards, plus the Oriental Mindoro provincial careers table. See [current nationwide source coverage](NATIONAL-CATALOG-2026-11-06.md) and `backend/database/data/catalog-source-coverage.json`. The [earlier Pasay replacement report](PESO-VACANCY-SOURCES.md) documents the first replacement snapshot. Neither snapshot is a complete feed from every Philippine PESO office.

Each imported record has its own HTTPS official PESO detail/application URL, source-posted date and actual detail-review timestamp. Qualifications are summarized from the source. Work locations are confirmed through the retained source qualifications, and explicit employment terms are preserved. Undisclosed salaries, deadlines and slot counts remain unknown. No skills are inferred from a job title or employer. Opening an application page does not submit a local referral or transmit a profile.

Run `python scripts/refresh-peso-vacancies.py --write` to review the current public source, inspect its coverage/exclusions, then `php artisan peso:import-verified-vacancies` from `backend/` to import it. Imports validate exact official detail URL patterns, update by source URL and preserve all account and workflow relationships. External records expire from browse/matching after 30 days without a new review, or sooner if a known deadline passes.

The former PhilJobNet dataset has been removed from active imports, browse, recommendations and the help page. Its existing database rows remain solely to preserve foreign keys and historical bookmarks. A provider's retirement does not mark every job as closed. Employer-owned vacancy management and its reviewed local referral workflow remain available.
