"""Review remaining public listing pages from the last page backwards.

Run alongside refresh-public-catalog.py. This follows the source's visible Last
and numbered page links and stores separate receipts. It handles older IDs with
newer posted dates rather than assuming a perfectly sorted historical archive.
No database writes. Merge the two completed reviews before curating/importing.
"""
import sys
import json
import time
import hashlib
import urllib.parse
import urllib.request
import importlib.util
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('catalog_review', root / 'scripts/refresh-public-catalog.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')
front = root / '.local/source-review/2026-11-03'
folder = front / 'remaining-pages'
folder.mkdir(exist_ok=True)
opener = urllib.request.build_opener()
markup, status = review.read_page(opener, review.BASE + '/job-vacancies/')
rows, receipts = {}, []
argument = 'Page$Last'
while True:
    soup = BeautifulSoup(markup, 'html.parser')
    # Ground each request in an actual public pagination link.
    if not any(argument in a.get('href', '') for a in soup.select('.pagination-ys a')):
        raise ValueError(f'Pagination action {argument} is absent')
    fields = {x['name']: x.get('value', '') for x in soup.select('input[type=hidden][name]')}
    fields.update({'__EVENTTARGET': 'ctl00$BodyContentPlaceHolder$GridView1', '__EVENTARGUMENT': argument, 'ctl00$BodyContentPlaceHolder$searchterm': ''})
    for attempt in range(3):
        try:
            markup, status = review.read_page(opener, review.BASE + '/job-vacancies/', urllib.parse.urlencode(fields).encode())
            break
        except Exception:
            if attempt == 2: raise
            time.sleep(2)
    soup = BeautifulSoup(markup, 'html.parser')
    page = int(soup.select_one('.pagination-ys span').get_text(strip=True))
    if argument != 'Page$Last' and page != int(argument.split('$')[1]):
        raise ValueError('Unexpected pagination response')
    stamp = datetime.now(timezone.utc).isoformat()
    _, candidates = review.parse_list(markup, stamp, page)
    if not candidates: raise ValueError('Empty listing page')
    filename = f'jobs-page-{page:04}.html'
    (folder / filename).write_bytes(markup.encode('utf-8'))
    receipts.append({'page': page, 'url': review.BASE + '/job-vacancies/', 'http_status': status,
                     'checked_at': stamp, 'file': 'remaining-pages/' + filename,
                     'sha256': hashlib.sha256(markup.encode()).hexdigest(),
                     'dates': sorted({r['source_posted_on'] for r in candidates})})
    for row in candidates:
        if '2026-10-14' <= row['source_posted_on'] <= '2026-11-03':
            rows[row['source_url']] = row
    review.save_json(folder / 'vacancy-candidates.json', list(rows.values()))
    review.save_json(folder / 'list-receipts.json', receipts)
    front_receipts = json.loads((front / 'list-receipts.json').read_text(encoding='utf-8'))
    last_front = max(r['page'] for r in front_receipts)
    if len(receipts) == 1 or len(receipts) % 10 == 0:
        print(json.dumps({'page': page, 'first_collector_reached': last_front, 'in_window': len(rows)}), flush=True)
    if page <= last_front + 1:
        review.save_json(folder / 'coverage.json', {'last_page': receipts[0]['page'], 'first_page': page,
            'pages': len(receipts), 'listings_in_window': len(rows), 'checked_at': stamp,
            'stop_reason': 'Backwards sweep joined the first collector; the union covers the entire public page range.'})
        print('COMPLETE backwards sweep', flush=True)
        break
    argument = f'Page${page - 1}'
    time.sleep(.2)
