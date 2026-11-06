"""Review public Pasay PESO listings without submitting forms or touching the DB.

Only --write replaces the reviewed vacancy dataset. Evidence stays in .local/.
Requires Python's standard library; HTTPS certificate validation stays enabled.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import hashlib
import html
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CATALOG = "https://pasay.gov.ph/job-openings/"
API = "https://pasay.gov.ph/wp-json/wp/v2/job-vacancy"
PH = timezone(timedelta(hours=8))


def allowed(url):
    p = urllib.parse.urlsplit(url)
    return (p.scheme == "https" and p.netloc == "pasay.gov.ph"
            and (p.path == "/job-openings/" or p.path.startswith("/peso-jobs/")
                 or p.path == "/wp-json/wp/v2/job-vacancy"))


class OfficialRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not allowed(newurl):
            raise ValueError("Redirect left the reviewed official source")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(url):
    if not allowed(url):
        raise ValueError("Unexpected public source URL")
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "PesoMatch-public-catalog-review/1.0",
                "Accept": "text/html,application/json",
            })
            with urllib.request.build_opener(OfficialRedirects()).open(req, timeout=25) as response:
                body = response.read(3_000_001)
                if len(body) > 3_000_000 or response.status != 200:
                    raise ValueError("Unexpected response size or status")
                return body, dict(response.headers)
        except Exception:
            if attempt:
                raise
            time.sleep(1)


def clean(value):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value)).split())


def employment_type(title, qualifications):
    text = title + " " + qualifications
    if re.search(r"\bproject.based\b", text, re.I):
        return "Project-based"
    if re.search(r"\bfull.time\b", text, re.I) and re.search(r"\bpart.time\b", text, re.I):
        return "Full-time / Part-time"
    return "See source qualifications"


def review(item):
    url = item["link"]
    try:
        raw, _ = fetch(url)
        body = raw.decode("utf-8")
        fields = [clean(v) for v in re.findall(
            r'<(?:div|h3) class="jet-listing-dynamic-field__content"\s*>(.*?)</(?:div|h3)>', body, re.S)]
        title = clean(item["title"]["rendered"])
        if len(fields) != 5 or fields[0] != f"Job Vacancy: {title}":
            raise ValueError("Detail identity/field layout needs manual review")
        posted = datetime.strptime(fields[1], "%B %d, %Y").date().isoformat()
        if posted != item["date"][:10] or not fields[2] or not fields[4]:
            raise ValueError("Missing or conflicting source facts")
        if "Submit Application" not in body or "Pasay City Public Employment Service Office" not in body:
            raise ValueError("No official PESO application instructions found")
        checked = datetime.now(PH).isoformat(timespec="seconds")
        # There is no dedicated work-site field. Some qualifications name a
        # location: keep that evidence in the summary, without guessing a site
        # from the posting office's jurisdiction.
        row = dict(title=title, organization=fields[2],
                   location="Confirm work location · Pasay PESO",
                   industry="Not stated", employment_type=employment_type(title, fields[4]),
                   source_posted_on=posted, source_salary=None, skills=[],
                   description=(f"Pasay PESO qualification summary: {fields[4]}\n\n"
                                "Review the full qualifications and application form on the official Pasay City PESO page. "
                                "Confirm the work location, employment arrangement and current availability with PESO or the employer."),
                   source_url=url, source_name="Pasay City Public Employment Service Office (PESO)",
                   checked_at=checked)
        receipt = dict(url=url, http_status=200, checked_at=checked,
                       sha256=hashlib.sha256(raw).hexdigest(), source_id=item["id"],
                       title=title, organization=fields[2], qualifications=fields[4],
                       application_form_present=True)
        return row, receipt
    except Exception as exc:
        return None, dict(url=url, excluded_reason=str(exc)[:180])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    started = datetime.now(PH)
    evidence = ROOT / ".local" / f"peso-vacancy-review-{started:%Y%m%d-%H%M%S}"
    evidence.mkdir(parents=True, exist_ok=True)
    fetch(CATALOG)
    first, headers = fetch(API + "?per_page=100&page=1")
    items = json.loads(first)
    pages = int(next(v for k, v in headers.items() if k.lower() == "x-wp-totalpages"))
    if pages > 30:
        raise ValueError("Catalog grew beyond the reviewed collection limit")
    for page in range(2, pages + 1):
        raw, _ = fetch(API + f"?per_page=100&page={page}")
        items.extend(json.loads(raw))
    cutoff = (started - timedelta(days=30)).date().isoformat()
    candidates = [r for r in items if "job-category-peso" in r.get("class_list", [])
                  and cutoff <= r["date"][:10] <= started.date().isoformat()]
    rows, receipts = [], []
    with ThreadPoolExecutor(max_workers=2) as pool:
        for index, (row, receipt) in enumerate(pool.map(review, candidates), 1):
            receipts.append(receipt)
            if row:
                rows.append(row)
            if index % 25 == 0:
                print(f"Reviewed {index}/{len(candidates)} public PESO detail pages", flush=True)
    rows.sort(key=lambda r: (r["source_posted_on"], r["source_url"]), reverse=True)
    if not rows or len({r["source_url"] for r in rows}) != len(rows):
        raise ValueError("Empty or duplicate catalog; existing data was preserved")
    report = dict(review_date=started.date().isoformat(), source_url=CATALOG,
                  source_name="Pasay City PESO", api_pages_reviewed=pages,
                  candidate_records=len(candidates), verified_detail_records=len(rows),
                  excluded=[r for r in receipts if "excluded_reason" in r],
                  coverage="Pasay PESO public listings, not nationwide coverage or a live feed",
                  limits="No dedicated work-site field; consult the retained qualifications for any location conditions. Employment terms are mapped only when explicit. No salary, deadline, slot count or skills are invented. Page access does not confirm an unfilled position.")
    for name, value in [("receipts.json", receipts), ("review.json", report), ("vacancies.json", rows)]:
        (evidence / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.write:
        data = ROOT / "backend/database/data"
        current = json.loads((data / "verified-vacancies.json").read_text(encoding="utf-8"))
        other_sources = [r for r in current if urllib.parse.urlsplit(r['source_url']).hostname != 'pasay.gov.ph']
        merged = {r['source_url']:r for r in other_sources + rows}
        (data / "verified-vacancies.json").write_text(json.dumps(list(merged.values()), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (data / "verified-peso-vacancy-coverage.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
