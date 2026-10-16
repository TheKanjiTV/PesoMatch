# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Data Sources

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

## Nationwide source-listed vacancies

Ten real PhilJobNet listing identities were inspected on October 10, 2026. PhilJobNet is the Bureau of Local Employment's official source. These records cover Luzon, Visayas and Mindanao; they are a researched selection rather than a complete national vacancy feed. Short descriptions and skill mappings are authored summaries and interpretations. No employer partnership, reserved opening, guaranteed suitability or current unfilled position is implied.

| Listing | Employer | Location | Source posted date |
| --- | --- | --- | --- |
| [STORE SUPERVISOR](https://philjobnet.gov.ph/job-vacancies/job/store-supervisor-1485835) | ROBINSONS HANDYMAN INC | Oroquieta City, Misamis Occidental | 2026-10-09 |
| [DRAFTSMAN (GENERAL)](https://philjobnet.gov.ph/job-vacancies/job/draftsman-general-1485834) | KC WONDERLAND CORPORATION | Mandaluyong City, NCR | 2026-10-09 |
| [ELECTRONICS TECHNICIAN](https://philjobnet.gov.ph/job-vacancies/job/electronics-technician-1485833) | KC WONDERLAND CORPORATION | Mandaluyong City, NCR | 2026-10-09 |
| [SERVICE CREW](https://philjobnet.gov.ph/job-vacancies/job/service-crew-1485832) | KC WONDERLAND CORPORATION | Manila City, NCR | 2026-10-09 |
| [ACCOUNTS COORDINATOR](https://philjobnet.gov.ph/job-vacancies/job/accounts-coordinator-1485831) | ASSURE QUALITY SERVICES, INC. | Bacolod City, Negros Occidental | 2026-10-09 |
| [DATA ANALYST](https://philjobnet.gov.ph/job-vacancies/job/data-analyst-1485827) | ARCH GLOBAL SERVICES (PHILIPPINES) INC | Taguig City, NCR | 2026-10-09 |
| [FINANCE OFFICER](https://philjobnet.gov.ph/job-vacancies/job/finance-officer-1485826) | ARCH GLOBAL SERVICES (PHILIPPINES) INC | Taguig City, NCR | 2026-10-09 |
| [HUMAN RESOURCE SUPERVISOR](https://philjobnet.gov.ph/job-vacancies/job/human-resource-supervisor-1476055) | VIENOVO PHILIPPINES INC. | Cebu City, Cebu | 2026-09-25 |
| [COMPUTER ENGINEER](https://philjobnet.gov.ph/job-vacancies/job/computer-engineer-1471205) | TECDIA CEBU, INC. | Lapu-Lapu City, Cebu | 2026-09-18 |
| [COOK (GENERAL)](https://philjobnet.gov.ph/job-vacancies/job/cook-general-1466691) | HOME OF CEBUANO CUISINE CORPORATION | Cebu City, Cebu | 2026-09-13 |

The detail view displays the source and checked date, official application link, original listed pay amount when supplied, and explicit unknowns. No deadline, position count or pay period was invented. External applications happen on PhilJobNet; opening the link does not create a local referral or claim the employer participates in this platform. General PESO guidance and private bookmarks remain available. External source listings are excluded from local partner position/demand totals, with a separate source-listing count.

Run `php artisan peso:import-verified-vacancies` from backend/ to update the researched dataset by unique source URL. Published source listings expire from browse and matching 30 days after their checked timestamp unless re-researched, or sooner when a known deadline passes. This is a stale-data safeguard, not a live availability check. Some candidate pages had past start dates or returned 404 on recheck and were excluded. Existing sample vacancies and local programs remain labeled illustrative samples.

The imported real catalog totals 28 records: ten PhilJobNet vacancies and eighteen TESDA courses. Source records create no users, applications, referrals, learner progress, placements or employment outcomes. Local partner management continues through the authorized review workflow.
