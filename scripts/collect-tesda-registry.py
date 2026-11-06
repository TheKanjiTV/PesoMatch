"""Review all public TESDA registered-program pages; never claim an open intake.

Writes a streaming JSONL catalog and coverage report only with --write.
Install the optional BeautifulSoup parser in .local/catalog-python, as used by
the existing source collectors. Public institutional facts only; no trainers.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
import hashlib
import json
from pathlib import Path
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.local/catalog-python'))
from bs4 import BeautifulSoup

BASE = 'https://www.tesda.gov.ph/Tvi/Result'
PH = timezone(timedelta(hours=8))


def fetch(page, folder):
    url = BASE + '?page=' + str(page)
    target = folder / f'page-{page}.html'
    receipt = folder / f'page-{page}.json'
    if target.exists() and receipt.exists():
        meta = json.loads(receipt.read_text(encoding='utf-8'))
        raw = target.read_bytes()
        if hashlib.sha256(raw).hexdigest() == meta['sha256']:
            return raw, meta
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'PesoMatch-public-training-review/1.0'})
            with urllib.request.urlopen(req, timeout=25) as response:
                if urllib.parse.urlsplit(response.url).hostname != 'www.tesda.gov.ph':
                    raise ValueError('Unexpected registry redirect')
                raw = response.read(3_000_001)
                if response.status != 200 or len(raw) > 3_000_000:
                    raise ValueError('Unexpected response')
            meta = dict(url=url, http_status=200, checked_at=datetime.now(PH).isoformat(timespec='seconds'),
                        sha256=hashlib.sha256(raw).hexdigest(), page=page)
            target.write_bytes(raw)
            receipt.write_text(json.dumps(meta), encoding='utf-8')
            return raw, meta
        except Exception:
            if attempt:
                raise
            time.sleep(1)


def parse(raw, meta):
    soup = BeautifulSoup(raw, 'html.parser')
    if not soup.find(string=re.compile('TVI with Registered Program')):
        raise ValueError('Registry identity missing')
    rows, excluded = [], []
    for card in soup.select('.directory-list'):
        details = card.select_one('.directory-description')
        heading = details.select_one('h4') if details else None
        topic = details.select_one('span') if details else None
        address = card.select_one('.directory-info p')
        provider = heading.get_text(' ', strip=True) if heading else ''
        course = topic.get_text(' ', strip=True) if topic else ''
        location = address.get_text(' ', strip=True) if address else ''
        if not provider or not course or course.lower().startswith('trainer') or not location:
            excluded.append(dict(page=meta['page'], provider=provider, reason='Missing institution, qualification or address'))
            continue
        url = BASE + '?' + urllib.parse.urlencode({'SearchCourse': course, 'SearchIns': provider, 'SearchLoc': location})
        if len(url) > 690:
            excluded.append(dict(page=meta['page'], provider=provider, qualification=course, reason='Exact registry lookup exceeds the supported URL length'))
            continue
        row = dict(title=course[:160], provider=provider[:160], location=location[:160],
                   mode='Confirm delivery mode', source_name='TESDA Registered Program Directory', source_url=url,
                   skills=[], description=f'Registered qualification: {course}\nInstitution: {provider}\nInstitution address: {location}\n\nThis entry is listed in the official TESDA registered-program directory. Registration is not confirmation of a current enrollment intake, available scholarship, delivery mode or fee. Verify the next intake with the institution through TESDA.',
                   requirements='Confirm admission requirements, schedule, training location and fees with the registered institution. Registration does not itself award a National Certificate.',
                   schedule='Registered program · intake not confirmed', fee=None, checked_at=meta['checked_at'],
                   evidence_page=meta['url'], evidence_sha256=meta['sha256'], record_type='registered_program')
        rows.append(row)
    pages = [int(v) for a in soup.select('a[href]') for v in re.findall(r'[?&]page=(\d+)', a['href'])]
    return rows, excluded, max(pages, default=meta['page'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    day = datetime.now(PH).date().isoformat()
    folder = ROOT / '.local/nationwide-review' / ('tesda-registry-' + day)
    folder.mkdir(parents=True, exist_ok=True)
    raw, meta = fetch(1, folder)
    initial, excluded, last = parse(raw, meta)
    if last > 2000:
        raise ValueError('Unexpected registry pagination range')
    records = {r['source_url']: r for r in initial}
    pages, errors = [meta], []
    def review(page):
        try:
            raw, receipt = fetch(page, folder)
            rows, skipped, observed_last = parse(raw, receipt)
            return rows, skipped, receipt, None
        except Exception as exc:
            return [], [], None, {'page':page, 'reason':str(exc)[:150]}
    with ThreadPoolExecutor(max_workers=2) as pool:
        for number, (rows, skipped, receipt, error) in enumerate(pool.map(review, range(2, last + 1)), 2):
            records.update({r['source_url']: r for r in rows})
            excluded.extend(skipped)
            if receipt:
                pages.append(receipt)
            if error:
                errors.append(error)
            if number % 25 == 0:
                print(f'Reviewed {number}/{last} TESDA pages; {len(records)} distinct registered programs', flush=True)
    hold_path = ROOT/'backend/database/data/verified-training-closure-holds.json'
    holds = json.loads(hold_path.read_text(encoding='utf-8')) if hold_path.exists() else []
    normalize = lambda value: re.sub(r'[^a-z0-9]', '', value.casefold())
    held = {(normalize(r['provider']), normalize(r['title'])) for r in holds}
    for url, row in list(records.items()):
        if (normalize(row['provider']), normalize(row['title'])) in held:
            excluded.append(dict(provider=row['provider'], qualification=row['title'], reason='Held for confirmation after official delisting notice match'))
            del records[url]
    values = sorted(records.values(), key=lambda r:(r['provider'],r['title'],r['location']))
    report = dict(review_date=day, source_url=BASE, observed_last_page=last, reviewed_pages=len(pages),
                  registered_programs=len(values), missing_pages=errors, excluded=excluded,
                  availability='Registered programs only; open intake and scholarships are not confirmed',
                  coverage='Nationwide official TESDA directory; not a list of active training cohorts',
                  first_checked_at=min(p['checked_at'] for p in pages), last_checked_at=max(p['checked_at'] for p in pages),
                  priority_locations={p:sum(p.casefold() in r['description'].casefold() for r in values) for p in ['Oriental Mindoro','Occidental Mindoro','Palawan','Puerto Princesa']})
    # The hold list is a separately researched snapshot. Retain its actual
    # review evidence rather than implying today's registry fetch rechecked it.
    prior_report=ROOT/'backend/database/data/verified-training-registry-coverage.json'
    if prior_report.exists():
        prior=json.loads(prior_report.read_text(encoding='utf-8'))
        if 'closure_review' in prior:
            report['closure_review']=prior['closure_review']
    (folder/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    output = folder/'registered-programs.jsonl'
    with output.open('w',encoding='utf-8',newline='\n') as stream:
        for row in values:
            stream.write(json.dumps(row,ensure_ascii=False)+'\n')
    if args.write:
        if errors or not values:
            raise ValueError('Incomplete review; current committed catalog preserved. Re-run to resume missing pages.')
        data = ROOT/'backend/database/data'
        (data/'verified-training-registry.jsonl').write_bytes(output.read_bytes())
        (data/'verified-training-registry-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='excluded'},indent=2))


if __name__ == '__main__':
    main()
