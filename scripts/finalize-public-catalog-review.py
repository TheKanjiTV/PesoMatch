"""Combine completed anonymous page sweeps after collectors have stopped.

Requires a receipt for every page through the source's observed Last page.
Verifies saved-page hashes and extracts only the inclusive requested date window.
Does not write to the application database or claim deleted-post coverage.
"""
import hashlib
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('catalog_review', root / 'scripts/refresh-public-catalog.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
folder = root / '.local/source-review/2026-11-03'
sys.stdout.reconfigure(encoding='utf-8')


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


back = read(folder / 'remaining-pages/list-receipts.json')
receipts = read(folder / 'list-receipts.json') + back + read(folder / 'numbered-pages/list-receipts.json')
last_page = back[0]['page']  # Response to the public Last page link.
missing = sorted(set(range(1, last_page + 1)) - {r['page'] for r in receipts})
assert not missing, missing
rows = {}
for index, receipt in enumerate(sorted(receipts, key=lambda r: r['checked_at'])):
    markup = (folder / receipt['file']).read_bytes().decode('utf-8')
    assert receipt['http_status'] == 200
    assert hashlib.sha256(markup.encode()).hexdigest() == receipt['sha256'], receipt['file']
    _, parsed = review.parse_list(markup, receipt['checked_at'], receipt['page'])
    for row in parsed:
        rows[row['source_url']] = row
    if index % 100 == 0:
        print('Verified page receipts:', index + 1, flush=True)
candidates = [r for r in rows.values() if '2026-10-14' <= r['source_posted_on'] <= '2026-11-03']
candidates.sort(key=lambda r: (r['source_posted_on'], r['source_url']), reverse=True)
review.save_json(folder / 'vacancy-candidates.json', candidates)
review.save_json(folder / 'all-list-receipts.json', receipts)
coverage = {'from': '2026-10-14', 'through': '2026-11-03', 'pages': last_page,
    'missing_pages': [], 'page_receipts': len(receipts), 'unique_source_identities_observed': len(rows),
    'listings': len(candidates), 'by_posted_date': dict(sorted(Counter(r['source_posted_on'] for r in candidates).items())),
    'first_checked_at': min(r['checked_at'] for r in receipts), 'checked_at': max(r['checked_at'] for r in receipts),
    'stop_reason': 'Verified union of front, backward and numbered sweeps covers every public page through the observed Last page.',
    'limits': 'A review of currently accessible public pages, not a historical archive. Deleted, private and inaccessible postings cannot be reconstructed. Public pagination can change while collection is running.'}
review.save_json(folder / 'coverage.json', coverage)
print(json.dumps(coverage), flush=True)
