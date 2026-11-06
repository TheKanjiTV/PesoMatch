"""Review publicly available regional PESO job boards. No accounts or forms.

Negros Jobs is linked by the provincial government's official website.
Public search is enumerated to overcome the portal's 24-card display limit.
Only detail-verified, non-expired openings are added; source gaps are reported.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import argparse
import hashlib
import json
from pathlib import Path
import re
import string
import sys
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.local/catalog-python'))
from bs4 import BeautifulSoup

PH=timezone(timedelta(hours=8))
FOLDER=ROOT/'.local/nationwide-review/regional-jobs'
FOLDER.mkdir(parents=True,exist_ok=True)
HOST='https://negrosjobs.mis-negros.com/'


def fetch(url):
    p=urllib.parse.urlsplit(url)
    if p.scheme!='https' or p.hostname not in ['negrosjobs.mis-negros.com','jobs.cityofcauayan.gov.ph']:
        raise ValueError('Unexpected public job source')
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'PesoMatch-public-peso-review/1.0'}),timeout=25) as r:
        if urllib.parse.urlsplit(r.url).hostname!=p.hostname or r.status!=200:
            raise ValueError('Source redirected or failed')
        raw=r.read(3_000_001)
        if len(raw)>3_000_000:raise ValueError('Unexpected source size')
    receipt=dict(url=url,http_status=200,checked_at=datetime.now(PH).isoformat(timespec='seconds'),sha256=hashlib.sha256(raw).hexdigest())
    return BeautifulSoup(raw,'html.parser'),receipt


def discover(letter):
    url=HOST+'home?'+urllib.parse.urlencode({'q':letter,'partial':1})
    try:
        soup,receipt=fetch(url)
        return {urllib.parse.urljoin(HOST,a['href']) for a in soup.select('article.jb-card a.jb-link[href]')},receipt
    except Exception as exc:return set(),dict(url=url,error=str(exc)[:120])


def detail(url):
    try:
        soup,receipt=fetch(url)
        title=soup.select_one('main h1').get_text(' ',strip=True)
        organization=soup.select_one('main .fw-semibold').get_text(' ',strip=True)
        facts={n.select_one('.label').get_text(' ',strip=True):n.select_one('.value').get_text(' ',strip=True) for n in soup.select('main .fact')}
        deadline=re.search(r'Until ([A-Za-z]+ \d+, \d{4})',facts.get('Posted',''))
        if not deadline:raise ValueError('No explicit current application deadline')
        end=datetime.strptime(deadline[1],'%b %d, %Y').date()
        if end<datetime.now(PH).date():raise ValueError('Application deadline has passed')
        if facts.get('Openings') == '0':raise ValueError('Source lists zero openings')
        if not soup.select_one('a[href="login"]') or not title or not organization or re.search(r'\b(test only|dummy|sample company)\b',title+' '+organization,re.I):
            raise ValueError('Missing application instructions or invalid identity')
        location=facts.get('Location','').strip()
        if not location:raise ValueError('No disclosed work location')
        skills=[]
        content=soup.select_one('main').get_text(' ',strip=True)
        for name,pattern in [('Communication',r'communication'),('Customer Service',r'customer service'),('Microsoft Excel',r'\bexcel\b'),('Sales',r'\bsales\b'),('Bookkeeping',r'bookkeeping')]:
            if re.search(pattern,content,re.I):skills.append(name)
        row=dict(title=title,organization=organization,location=location,industry='See official qualifications',
                 employment_type=facts.get('Schedule','See official listing'),source_posted_on=None,
                 source_salary=facts.get('Salary') if facts.get('Salary') not in ['Confidential','Not specified'] else None,
                 slots=int(facts['Openings']) if facts.get('Openings','').isdigit() else None,deadline=end.isoformat(),skills=skills,
                 description=f'Official PESO Negros Occidental posting for {title} at {organization}. The source lists this opening with an application deadline of {end.isoformat()}. Work setup: {facts.get("Work setup","Not stated")}. Review the complete duties, qualifications and application instructions on the official listing. Listed openings are not a guarantee of remaining unfilled places.',
                 source_url=url,source_name='PESO Negros Occidental · Negros Jobs',checked_at=receipt['checked_at'],availability='source_lists_open',source_posted_text=facts.get('Posted'))
        return row,receipt
    except Exception as exc:return None,dict(url=url,excluded_reason=str(exc)[:160],review_error=not isinstance(exc,ValueError))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write',action='store_true')
    args=parser.parse_args()
    urls=set();receipts=[]
    with ThreadPoolExecutor(max_workers=2) as pool:
        for links,receipt in pool.map(discover,['']+list(string.ascii_lowercase)):
            urls.update(links);receipts.append(receipt)
    rows=[]
    with ThreadPoolExecutor(max_workers=2) as pool:
        for row,receipt in pool.map(detail,sorted(urls)):
            receipts.append(receipt)
            if row:rows.append(row)
    # Cauayan's public listing is accessible even when its detail requires login.
    url='https://jobs.cityofcauayan.gov.ph/pages/jobs.php'
    try:
        soup,receipt=fetch(url);receipts.append(receipt)
        cards=soup.select('a[href^="job_detail.php?id="]')
        cauayan=dict(name='PESO Cauayan City',source_url=url,public_job_cards=len(cards),included=0,limitation='Detail access requires sign-in; no application deadline confirmed')
    except Exception as exc:
        cauayan=dict(name='PESO Cauayan City',source_url=url,included=0,limitation='Public source unavailable: '+str(exc)[:120])
    report=dict(review_date=datetime.now(PH).date().isoformat(),sources=[dict(name='PESO Negros Occidental',official_endorsement='https://www.negros-occ.gov.ph/negros-jobs/',observed_detail_urls=len(urls),included=len(rows)),cauayan],excluded=[r for r in receipts if 'excluded_reason' in r],search_errors=[r for r in receipts if 'error' in r])
    (FOLDER/'receipts.json').write_text(json.dumps(receipts,indent=2)+'\n',encoding='utf-8')
    (FOLDER/'coverage.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    if not args.write:
        print(json.dumps(report,indent=2))
        return
    if not rows or report['search_errors'] or any(r.get('review_error') for r in receipts):
        raise ValueError('Incomplete review; current committed catalog preserved. Inspect public source receipts before retrying.')
    data=ROOT/'backend/database/data'
    current=json.loads((data/'verified-vacancies.json').read_text(encoding='utf-8'))
    merged={r['source_url']:r for r in current if urllib.parse.urlsplit(r['source_url']).hostname!='negrosjobs.mis-negros.com'}
    merged.update({r['source_url']:r for r in rows})
    (data/'verified-vacancies.json').write_text(json.dumps(list(merged.values()),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (data/'verified-regional-vacancies.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (data/'verified-regional-vacancy-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))


if __name__=='__main__':main()
