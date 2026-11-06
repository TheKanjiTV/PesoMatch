"""Snapshot public PhilJobNet pages for review; never writes to the application DB.

Install the optional research parser under .local/catalog-python:
python -m pip install --target .local/catalog-python beautifulsoup4==4.14.3
Run from the project root. HTML and request receipts stay in ignored .local/.
"""
import argparse
import hashlib
import http.cookiejar
import json
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / '.local/catalog-python'))
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')
FOLDER = ROOT / '.local/source-review/2026-11-03'
BASE = 'https://philjobnet.gov.ph'


def save_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def read_page(opener, url, data=None):
    request = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded'})
    with opener.open(request, timeout=30) as response:
        return response.read().decode('utf-8'), response.status


def parse_list(markup, checked_at, page):
    soup = BeautifulSoup(markup, 'html.parser')
    rows = []
    for link in soup.find_all('a', href=lambda v: v and '/job-vacancies/job/' in v):
        def text(selector):
            element = link.select_one(selector)
            if element is None:
                raise ValueError(f'Missing {selector} on page {page}')
            return element.get_text(' ', strip=True)
        def icon_text(icon):
            element = link.select_one(f'i.{icon}')
            if element is None:
                raise ValueError(f'Missing {icon} on page {page}')
            return element.parent.get_text(' ', strip=True)
        posted = datetime.strptime(icon_text('bi-files'), 'Posted on %m/%d/%Y').date().isoformat()
        salary = text('.salary')
        rows.append({
            'title': text('.jobtitle'), 'organization': text('.companytitle'),
            'location': icon_text('bi-geo-alt'), 'education': icon_text('bi-mortarboard'),
            'employment_type': icon_text('bi-file-text'), 'source_posted_on': posted,
            'source_salary': None if salary in ('Salary not specified', '₱0.00') else salary,
            'source_url': urllib.parse.urljoin(BASE, link['href']),
            'source_name': 'PhilJobNet · Bureau of Local Employment',
            'checked_at': checked_at, 'evidence_page': page,
        })
    return soup, rows


def collect(start, end):
    FOLDER.mkdir(parents=True, exist_ok=True)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    markup, status = read_page(opener, BASE + '/job-vacancies/')
    checked_at = datetime.now(timezone.utc).isoformat()
    all_rows, receipts, seen = [], [], set()
    page = 1
    while True:
        soup, rows = parse_list(markup, checked_at, page)
        if not rows:
            raise ValueError(f'No rows on page {page}; refuse to report complete coverage')
        active = soup.select_one('.pagination-ys span')
        if active is not None and active.get_text(strip=True) != str(page):
            raise ValueError(f'Requested page {page}, received {active.get_text(strip=True)}')
        signature = tuple(row['source_url'] for row in rows)
        if signature in seen:
            raise ValueError('Repeated page; refuse to report complete coverage')
        seen.add(signature)
        filename = f'jobs-page-{page:04}.html'
        (FOLDER / filename).write_bytes(markup.encode('utf-8'))
        receipts.append({'url': BASE + '/job-vacancies/', 'page': page, 'http_status': status,
                         'checked_at': checked_at, 'sha256': hashlib.sha256(markup.encode()).hexdigest(),
                         'file': filename, 'dates': sorted(set(r['source_posted_on'] for r in rows))})
        all_rows.extend(row for row in rows if start <= row['source_posted_on'] <= end)
        save_json(FOLDER / 'vacancy-candidates.json', list({r['source_url']: r for r in all_rows}.values()))
        save_json(FOLDER / 'list-receipts.json', receipts)
        if page == 1 or page % 10 == 0:
            print(json.dumps({'page': page, 'oldest': min(r['source_posted_on'] for r in rows), 'in_window': len(all_rows)}), flush=True)
        if all(row['source_posted_on'] < start for row in rows):
            unique = list({r['source_url']: r for r in all_rows}.values())
            save_json(FOLDER / 'coverage.json', {'from': start, 'through': end, 'pages': page,
                'listings': len(unique), 'by_posted_date': dict(sorted(Counter(r['source_posted_on'] for r in unique).items())),
                'stop_reason': 'Reached a full page older than the requested window in the default newest-first public listing.',
                'checked_at': checked_at, 'limits': 'Currently accessible public listing pages only; deleted, unlisted, or inaccessible historical postings cannot be reconstructed. Pagination can change during collection.'})
            print('COMPLETE', len(all_rows), 'list rows', flush=True)
            break
        next_page = page + 1
        fields = {x['name']: x.get('value', '') for x in soup.select('input[type=hidden][name]')}
        fields.update({'__EVENTTARGET': 'ctl00$BodyContentPlaceHolder$GridView1', '__EVENTARGUMENT': f'Page${next_page}', 'ctl00$BodyContentPlaceHolder$searchterm': ''})
        time.sleep(0.2)
        for attempt in range(3):
            try:
                markup, status = read_page(opener, BASE + '/job-vacancies/', urllib.parse.urlencode(fields).encode())
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2)
        page = next_page
        checked_at = datetime.now(timezone.utc).isoformat()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--from-date', default='2026-10-14')
    parser.add_argument('--through-date', default='2026-11-03')
    args = parser.parse_args()
    collect(args.from_date, args.through_date)
