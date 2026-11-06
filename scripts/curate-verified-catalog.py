"""Build reviewed factual catalogue additions from saved primary-source evidence.

This script does not scrape or import personal records or invent vacancies,
partners, attendance, placements, enrollment capacity or qualification outcomes.
"""
import hashlib
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

raise SystemExit('Historical curator retired. Use scripts/refresh-peso-vacancies.py --write for current PESO vacancies.')

root = Path(__file__).resolve().parent.parent
evidence = root / ".local/source-review"
data = root / "backend/database/data"
checked = datetime.now(timezone.utc).isoformat()

jobs = [
    (1488265, "stockman", "STOCKMAN", "SURPLUS MARKETING CORPORATION", "Bacoor, Cavite", "Wholesale and retail trade", ["Customer Service"], "Customer-facing stock role. Review the source qualifications and application instructions.", "₱600.00"),
    (1488264, "sales-clerk", "SALES CLERK", "SURPLUS MARKETING CORPORATION", "Bacoor, Cavite", "Wholesale and retail trade", ["Customer Service"], "Retail role seeking customer-service orientation. Qualifications are stated on the official listing.", "₱600.00"),
    (1488263, "chief-security-officer", "CHIEF SECURITY OFFICER", "GAISANO BROS. MERCHANDISING, INCORPORATED", "Cebu City, Cebu", "Wholesale and retail trade", ["Leadership", "Communication", "Risk Management", "Security Operations"], "Lead security operations, personnel supervision, risk assessments and incident reporting. Relevant security-management experience is required.", None),
    (1488258, "automotive-mechanic-gov", "AUTOMOTIVE MECHANIC (GOV)", "GAISANO BROS. MERCHANDISING, INCORPORATED", "Cebu City, Cebu", "Wholesale and retail trade", ["Vehicle Maintenance", "Automotive Repair", "Troubleshooting"], "Inspect, maintain and repair company vehicles. Relevant technical education and automotive maintenance experience are requested.", None),
    (1488253, "estimator", "ESTIMATOR", "ABOITIZ CONSTRUCTION, INC", "Taguig City, NCR", "Construction", ["Cost Estimation", "Microsoft Excel", "Communication", "Time Management"], "Prepare construction estimates and evaluate supplier proposals. The source requests civil-engineering education and five years of related estimation experience.", None),
    (1488252, "operations-coordinator", "OPERATIONS COORDINATOR", "JOB CLEAN MANPOWER AND GENERAL SERVICES PHIL. INC.", "Mandaluyong City, NCR", "Activities of private households as employers", ["Administrative Support", "Workflow Coordination", "Inventory Management"], "Coordinate site operations, administrative support, workflow monitoring and vendor or inventory logistics.", None),
    (1488251, "store-supervisor", "STORE SUPERVISOR", "ABENSON VENTURES, INC.", "Tagbilaran City, Bohol", "Wholesale and retail trade", ["Sales", "Leadership", "Customer Service", "Communication", "Negotiation"], "Supervise branch sales and operations. Related degree and retail supervisory experience are requested by the employer.", "₱19,000.00"),
    (1488250, "project-manager", "PROJECT MANAGER", "ABOITIZ CONSTRUCTION, INC", "Batangas City, Batangas", "Construction", ["Project Management", "Budgeting", "Communication", "Risk Management"], "Coordinate construction planning, budgets, schedules, resources and project risks. Consult the complete employer qualifications before applying.", None),
    (1488249, "administrative-assistant", "ADMINISTRATIVE ASSISTANT", "JOB CLEAN MANPOWER AND GENERAL SERVICES PHIL. INC.", "Davao City, Davao del Sur", "Activities of private households as employers", ["Administrative Support", "Communication", "Scheduling", "Records Management"], "Support office communications, scheduling, records, correspondence and meeting logistics.", None),
    (1488248, "sales-associate-professional", "SALES ASSOCIATE PROFESSIONAL", "DRAKE MARKETING AND EQUIPMENT CORPORATION", "San Juan City, NCR", "Wholesale and retail trade", ["Sales", "Customer Service", "Computer Literacy", "Product Knowledge"], "Promote products, cover an assigned territory and report sales. The employer requests retail sales experience and basic computer skills.", "₱600.00"),
]

existing = json.loads((data / "verified-vacancies.json").read_text(encoding="utf-8"))
by_url = {row["source_url"]: row for row in existing}
for row in existing:
    identifier = row["source_url"].rsplit("-", 1)[-1]
    source = (evidence / f"job-{identifier}.html").read_text(encoding="utf-8")
    assert "Job Description" in source and row["title"].casefold() in html.unescape(source).casefold()
    row["checked_at"] = checked
for identifier, slug, title, organization, location, industry, skills, description, salary in jobs:
    source = html.unescape((evidence / f"job-{identifier}.html").read_text(encoding="utf-8"))
    assert title in source and organization in source and "13 October 2026" in source
    url = f"https://philjobnet.gov.ph/job-vacancies/job/{slug}-{identifier}"
    by_url[url] = dict(title=title, organization=organization, location=location, industry=industry, employment_type="Permanent", source_posted_on="2026-10-13", source_salary=salary, skills=skills, description=description, source_url=url, source_name="PhilJobNet · Bureau of Local Employment", checked_at=checked)

catalog_source = (evidence / "tesda-catalog.html").read_text(encoding="utf-8")
catalog_titles = {}
for url, markup in re.findall(r'<a[^>]*href="([^"]*course/view[^"]*)"[^>]*>(.*?)</a>', catalog_source, re.S):
    text = " ".join(html.unescape(re.sub(r"<[^>]+>", "", markup)).split())
    # The second occurrence is the title, without the category suffix.
    catalog_titles[url] = text
courses = [
    (3981, "Introduction to Bookkeeping", ["Bookkeeping"]),
    (4030, "Preparing Financial Reports", ["Financial Reporting", "Bookkeeping"]),
    (4029, "Preparing Trial Balance", ["Bookkeeping", "Accounting"]),
    (4017, "Reviewing Internal Control System", ["Internal Controls", "Bookkeeping"]),
    (3470, "Introduction to Technical Drafting", ["Technical Drawing"]),
    (3472, "Preparing Computer-Aided Drawings", ["CAD", "Technical Drawing"]),
    (4, "Providing Front Office Services", ["Front Office Services", "Customer Service"]),
    (96, "Providing Housekeeping Services", ["Housekeeping"]),
    (119, "Providing Table Service", ["Food and Beverage Service", "Customer Service"]),
    (120, "Providing Room Service", ["Food and Beverage Service", "Customer Service"]),
    (2001, "Module 1: Crafting Your Career", ["Career Planning"]),
    (2002, "Module 2: Your Guide to Job Readiness", ["Job Readiness"]),
    (2014, "Module 3: Building Human Skills for Career Success", ["Communication", "Human Skills"]),
    (5039, "Self-Management", ["Self-Management"]),
    (5041, "Problem Solving & Innovation", ["Problem Solving"]),
    (105, "Start and Improve Your Business", ["Entrepreneurship", "Business Planning"]),
]
training = json.loads((data / "verified-training.json").read_text(encoding="utf-8"))
training_by_url = {row["source_url"]: row for row in training}
for identifier, title, skills in courses:
    url = f"https://e-tesda.gov.ph/course/view.php?id={identifier}"
    assert catalog_titles.get(url) == title, (identifier, title, catalog_titles.get(url))
    training_by_url[url] = dict(title=title, source_url=url, source_name="TESDA Online Program", category_url="https://e-tesda.gov.ph/course/search.php?perpage=all&search=ID", skills=skills, description=f"Official TESDA Online Program catalog entry: {title}. Review the official syllabus and prerequisites before enrolling; completing this course does not automatically issue a National Certificate.", checked_at=checked)
for row in training_by_url.values():
    if row["source_url"] in catalog_titles or row["source_url"].endswith("id=52"):
        row["checked_at"] = checked

metadata = json.loads((evidence / "psa-metadata.json").read_text(encoding="utf-8"))
values = json.loads((evidence / "psa-rates.json").read_text(encoding="utf-8"))
rates = []
for row in values["data"]:
    assert row["key"][0:2] == ["21", "7"] and row["key"][3] == "0"
    index = metadata["variables"][2]["values"].index(row["key"][2])
    rates.append(dict(label=metadata["variables"][2]["valueTexts"][index], value=float(row["values"][0]), unit="percent"))
resources = [dict(title="Philippine labor force indicators — August 2026", publisher="Philippine Statistics Authority · OpenSTAT", source_url="https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__1B__LFS/0021B3FKEI2.px/", reference_period="August 2026", scope="Philippines · both sexes · age 15 and over", indicators=rates, notes="Preliminary PSA Labor Force Survey estimates; may be revised. Rounded display values are national survey statistics, separate from PesoMatch platform records.", checked_at=checked)]

events = []
for reference, title, location, day, status in [
    ("JFC-DORFO-019-2026-1027", "PESO Maco Job Fair", "Municipal Gymnasium, Maco, Davao de Oro", "2026-10-27", "published"),
    ("JFCDCFO-1013-14-2026-046", "PESO Davao and DICT employment fair", "SM City Davao Annex Event Center, Ecoland, Davao City", "2026-10-13", "published"),
    ("2026-10-02-sta-cruz", "PESO Sta. Cruz Job Fair", "New Municipal Gymnasium, Escandor Road, Zone III, Sta. Cruz, Davao del Sur", "2026-10-02", "completed"),
    ("2026-09-14-digos", "Handog ng Pangulo Job Fair — Digos", "Tablizo Gym, Digos City", "2026-09-14", "completed"),
]:
    url = "https://ro11.dole.gov.ph/job-fair-schedules/"
    events.append(dict(source_key=hashlib.sha256(f"{url}#{reference}".encode()).hexdigest(), source_reference=reference, title=title, type="Job fair", location=location, event_date=day, status=status, description="Official calendar reference. Confirm changes and opening hours with the organizer; no attendance or hiring outcome is implied.", source_url=url, source_name="DOLE XI · 2026 Job Fair Schedules", checked_at=checked, verification_method="Official indexed schedule reviewed; direct automated retrieval returned HTTP 403."))

for name, rows in [("verified-vacancies", list(by_url.values())), ("verified-training", list(training_by_url.values())), ("verified-events", events), ("verified-public-resources", resources)]:
    (data / f"{name}.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{name}: {len(rows)} reviewed records")
