"""Snapshot detail evidence while refresh-public-catalog.py collects the list.

Run from the project root. Two anonymous workers; no authentication or DB writes.
The dated collector waits for coverage.json before finishing its review queue.
"""
import sys,json,time,hashlib,urllib.request,concurrent.futures
from pathlib import Path
from datetime import datetime,timezone
sys.path.insert(0,'.local/catalog-python')
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding='utf-8')
folder=Path('.local/source-review/2026-11-03')
receipts_path=folder/'detail-receipts.json'
receipts=json.loads(receipts_path.read_text(encoding='utf-8')) if receipts_path.exists() else []
seen={r['source_url'] for r in receipts}
def fetch(row):
 url=row['source_url'];receipt={'source_url':url,'checked_at':datetime.now(timezone.utc).isoformat()}
 try:
  with urllib.request.urlopen(url,timeout=25) as response:
   raw=response.read();receipt['http_status']=response.status
  markup=raw.decode('utf-8');soup=BeautifulSoup(markup,'html.parser')
  title=soup.select_one('.jobtitle'); company=soup.select_one('.companytitle')
  if not title or not company or title.get_text(' ',strip=True)!=row['title'] or company.get_text(' ',strip=True)!=row['organization']:
   raise ValueError('Detail identity differs from list evidence')
  filename='job-'+url.rsplit('-',1)[-1]+'.html';(folder/filename).write_bytes(raw)
  receipt.update({'file':filename,'sha256':hashlib.sha256(raw).hexdigest()})
 except Exception as error:receipt['error']=str(error)
 return receipt
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
 while True:
  try: rows=json.loads((folder/'vacancy-candidates.json').read_text(encoding='utf-8'))
  except (json.JSONDecodeError,PermissionError):time.sleep(1);continue
  pending=[row for row in rows if row['source_url'] not in seen][:40]
  if not pending:
   if (folder/'coverage.json').exists():break
   time.sleep(3);continue
  for receipt in executor.map(fetch,pending):
   receipts.append(receipt);seen.add(receipt['source_url'])
   receipts_path.write_text(json.dumps(receipts,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
   time.sleep(.15)
  print(json.dumps({'details_checked':len(receipts),'errors':sum('error' in r for r in receipts)}),flush=True)
print('COMPLETE',len(receipts),'detail requests',flush=True)
