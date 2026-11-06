"""Complete unvisited numbered public pages using bounded anonymous requests.

Each POST is grounded in a visible pagination link and its own form snapshot.
Existing front/back receipts are reused. Outputs remain anonymous review files.
"""
import concurrent.futures
import hashlib
import importlib.util
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('catalog_review', root / 'scripts/refresh-public-catalog.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')
front = root / '.local/source-review/2026-11-03'
folder = front / 'numbered-pages'
folder.mkdir(exist_ok=True)
receipts = json.loads((folder / 'list-receipts.json').read_text(encoding='utf-8')) if (folder / 'list-receipts.json').exists() else []
candidates = {r['source_url']: r for r in json.loads((folder / 'vacancy-candidates.json').read_text(encoding='utf-8'))} if (folder / 'vacancy-candidates.json').exists() else {}
pending, scheduled = {}, set()


def read_receipts(path):
    for _ in range(5):
        try:
            return review_path(path)
        except (json.JSONDecodeError, PermissionError):
            time.sleep(.1)
    raise ValueError('A running collector did not finish writing receipts')


def review_path(path):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else []


def visited():
    return {r['page'] for path in [front / 'list-receipts.json', front / 'remaining-pages/list-receipts.json'] for r in read_receipts(path)} | {r['page'] for r in receipts}


def discover(markup):
    soup = BeautifulSoup(markup, 'html.parser')
    fields = {x['name']: x.get('value', '') for x in soup.select('input[type=hidden][name]')}
    for anchor in soup.select('.pagination-ys a'):
        match = re.search(r'Page\$(\d+)', anchor.get('href', ''))
        if not match: continue
        page = int(match[1])
        if page not in scheduled:
            scheduled.add(page)
            data = fields | {'__EVENTTARGET': 'ctl00$BodyContentPlaceHolder$GridView1', '__EVENTARGUMENT': f'Page${page}', 'ctl00$BodyContentPlaceHolder$searchterm': ''}
            pending[page] = urllib.parse.urlencode(data).encode()


def fetch(task):
    page, payload = task
    opener = urllib.request.build_opener()
    for attempt in range(3):
        try:
            markup, status = review.read_page(opener, review.BASE + '/job-vacancies/', payload)
            stamp = datetime.now(timezone.utc).isoformat()
            soup, rows = review.parse_list(markup, stamp, page)
            assert int(soup.select_one('.pagination-ys span').get_text(strip=True)) == page
            assert rows
            return page, markup, status, stamp, rows
        except Exception:
            if attempt == 2: raise
            time.sleep(2)


first = read_receipts(front / 'list-receipts.json')[-1]
discover((front / first['file']).read_text(encoding='utf-8'))
if receipts:
    discover((front / receipts[-1]['file']).read_text(encoding='utf-8'))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    while pending:
        seen = visited()
        for page in list(pending):
            if page in seen: pending.pop(page)
        tasks = list(pending.items())[:4]
        if not tasks: break
        for page, _ in tasks: pending.pop(page)
        for page, markup, status, stamp, rows in pool.map(fetch, tasks):
            filename = f'jobs-page-{page:04}.html'
            (folder / filename).write_bytes(markup.encode('utf-8'))
            receipts.append({'page': page, 'url': review.BASE + '/job-vacancies/', 'http_status': status,
                'checked_at': stamp, 'file': 'numbered-pages/' + filename,
                'sha256': hashlib.sha256(markup.encode()).hexdigest(), 'dates': sorted({r['source_posted_on'] for r in rows})})
            for row in rows:
                if '2026-10-14' <= row['source_posted_on'] <= '2026-11-03': candidates[row['source_url']] = row
            discover(markup)
        review.save_json(folder / 'list-receipts.json', receipts)
        review.save_json(folder / 'vacancy-candidates.json', list(candidates.values()))
        if len(receipts) % 10 == 0:
            print(json.dumps({'additional_pages': len(receipts), 'public_pages_reviewed': len(visited()), 'latest_page': page}), flush=True)
        time.sleep(.2)
all_seen = visited()
last = max(all_seen)
missing = sorted(set(range(1, last + 1)) - all_seen)
assert not missing, missing
review.save_json(folder / 'coverage.json', {'all_public_pages': last, 'additional_pages': len(receipts), 'missing_pages': missing})
print('COMPLETE: all', last, 'numbered public pages reviewed', flush=True)
