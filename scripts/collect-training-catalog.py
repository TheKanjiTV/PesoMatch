"""Snapshot the anonymous TESDA category tree; outputs review candidates only.

Run from the project root after installing the optional parser documented in
refresh-public-catalog.py. This dated review does not infer course posting dates.
"""
import sys,json,urllib.request,urllib.parse,time,hashlib
from pathlib import Path
from datetime import datetime,timezone
sys.path.insert(0,'.local/catalog-python')
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding='utf-8')
folder=Path('.local/source-review/2026-11-03')
queue=['https://e-tesda.gov.ph/course/index.php?perpage=1000']
seen=set(); courses={};receipts=[]
while queue:
 url=queue.pop(0)
 if url in seen:continue
 seen.add(url)
 try:
  with urllib.request.urlopen(url,timeout=30) as r:
   raw=r.read(); markup=raw.decode('utf-8');status=r.status
 except Exception as e:
  print('ERROR',url,str(e),flush=True);receipts.append({'url':url,'error':str(e)});continue
 soup=BeautifulSoup(markup,'html.parser'); stamp=datetime.now(timezone.utc).isoformat()
 filename='tesda-category-'+hashlib.sha256(url.encode()).hexdigest()[:12]+'.html'
 (folder/filename).write_bytes(raw)
 receipts.append({'url':url,'file':filename,'http_status':status,'sha256':hashlib.sha256(raw).hexdigest(),'checked_at':stamp})
 for card in soup.select('[data-course-id]'):
  link=card.select_one('a.coursename') or card.find('a',href=lambda v:v and '/course/view.php?' in v)
  if not link:continue
  title=link.get_text('',strip=True)
  if not title:
   title=card.select_one('.sr-only').get_text('',strip=True)
  category=card.select_one('.course-category')
  summary=card.select_one('.course-summary')
  courses[link['href']]={'title':title,'source_url':link['href'],'category':category.get_text(' ',strip=True) if category else '', 'summary':summary.get_text('',strip=True) if summary else '', 'category_url':url,'checked_at':stamp,'evidence_file':filename}
 for link in soup.find_all('a',href=True):
  parsed=urllib.parse.urlparse(link['href'])
  query=urllib.parse.parse_qs(parsed.query)
  if parsed.hostname=='e-tesda.gov.ph' and parsed.path=='/course/index.php' and 'categoryid' in query:
   target='https://e-tesda.gov.ph/course/index.php?categoryid='+query['categoryid'][0]+'&perpage=1000'
   if target not in seen and target not in queue:queue.append(target)
 # Root and category pagination should be unnecessary with perpage=1000;
 # retain explicit next-page links if the provider imposes a smaller page size.
 for link in soup.select('a[rel=next]'):
  if link['href'] not in seen and link['href'] not in queue:queue.append(link['href'])
 (folder/'training-candidates.json').write_text(json.dumps(list(courses.values()),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (folder/'training-receipts.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 if len(seen)%10==0 or len(seen)==1:print(json.dumps({'categories':len(seen),'pending':len(queue),'courses':len(courses)}),flush=True)
 time.sleep(.15)
print('COMPLETE',len(seen),'categories;',len(courses),'course identities',flush=True)
