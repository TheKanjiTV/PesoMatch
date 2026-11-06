"""Curate the November 3 reviewed public-source snapshots. No database writes.

Inputs are saved anonymous official pages plus request receipts in .local/.
Skill tags are conservative authored topic mappings, never qualifications or
verified abilities. Full employer/course descriptions remain on their sources.
"""
import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / '.local/catalog-python'))
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')
EVIDENCE = ROOT / '.local/source-review/2026-11-03'
DATA = ROOT / 'backend/database/data'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, rows):
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


TOPICS = [
    ('Communication', r'communicat'), ('Microsoft Excel', r'\bexcel\b'),
    ('Microsoft Word', r'microsoft word|ms word'), ('Microsoft Office', r'microsoft office|ms office'),
    ('Customer Service', r'customer service|customer care|customer centric'),
    ('Sales', r'\bsales\b|selling'), ('Marketing', r'\bmarketing\b'),
    ('Digital Marketing', r'digital marketing'), ('Social Media', r'social media'),
    ('Content Creation', r'content creat'), ('Graphic Design', r'graphic design'),
    ('Bookkeeping', r'bookkeep'), ('Accounting', r'accounting|accountant'),
    ('Financial Reporting', r'financial report'), ('Budgeting', r'budget'),
    ('Data Analysis', r'data analy'), ('Data Entry', r'data entry|data encod'),
    ('Records Management', r'record.?keeping|records management'),
    ('Administrative Support', r'administrative support|office administration'),
    ('Scheduling', r'\bscheduling\b'), ('Inventory Management', r'inventory management|inventory control'),
    ('Project Management', r'project management'), ('Leadership', r'leadership'),
    ('Problem Solving', r'problem.solv'), ('Time Management', r'time management'),
    ('Computer Literacy', r'computer liter|computer skill|digital liter'),
    ('Computer Networking', r'computer networks|computer networking'),
    ('Computer Hardware', r'computer hardware|computer systems servicing'),
    ('Cybersecurity', r'cybersecurity|cyber.security'), ('Data Privacy', r'data privacy'),
    ('Artificial Intelligence', r'artificial intelligence|\bai fundamentals\b|\bai practitioner\b'),
    ('Cloud Computing', r'cloud computing|cloud practitioner'), ('Programming', r'programming'),
    ('AutoCAD', r'\bautocad\b'), ('Technical Drawing', r'technical draft|technical draw|computer.aided draw'),
    ('Cost Estimation', r'cost estimat'), ('Welding', r'\bwelding\b|\bwelder\b'),
    ('Plumbing', r'plumbing|\bplumber\b'), ('Electrical Installation', r'electrical install|electrician'),
    ('Vehicle Maintenance', r'vehicle maintenance|automotive servicing|engine repair'),
    ('Driving', r'\bdriving\b|\bdriver\b'), ('Troubleshooting', r'troubleshoot'),
    ('Food Preparation', r'food preparation|cookery|\bcook\b|\bchef\b'),
    ('Food Safety', r'food safety|food hygiene'), ('Baking', r'baking|bread and pastry|preparing cakes'),
    ('Housekeeping', r'housekeeping'), ('Caregiving', r'caregiving|caregiver'),
    ('Massage Therapy', r'massage'), ('Agriculture', r'agriculture|agricultural|crop production'),
    ('Entrepreneurship', r'entrepreneur|business planning'), ('Risk Management', r'risk management'),
]


def skills(text):
    return [label for label, pattern in TOPICS if re.search(pattern, text, re.I)]


def training():
    previous = {r['source_url']: r for r in read(DATA / 'verified-training.json')}
    rows = read(EVIDENCE / 'training-candidates.json')
    for row in rows:
        markup = (EVIDENCE / row['evidence_file']).read_text(encoding='utf-8')
        soup = BeautifulSoup(markup, 'html.parser')
        identifier = row['source_url'].split('id=')[-1]
        assert soup.select_one(f'[data-course-id="{identifier}"]'), row['source_url']
        # The official catalog contains a replacement character in this title.
        title = row['title'].replace('BSP\ufffds', "BSP's")
        assert '\ufffd' not in title, title
        existing = previous.get(row['source_url'])
        mapped = existing['skills'] if existing else skills(title + ' ' + row['category'])
        previous[row['source_url']] = {
            'title': title, 'source_url': row['source_url'],
            'source_name': 'TESDA Online Program', 'category_url': row['category_url'],
            'skills': mapped,
            'description': existing['description'] if existing else (
                f"TESDA lists this module under {row['category']}. Review the official syllabus, intended audience and access requirements before enrolling. Course completion does not automatically issue a National Certificate."),
            'checked_at': row['checked_at'],
        }
    write(DATA / 'verified-training.json', list(previous.values()))
    print('Training:', len(rows), 'current source identities;', len(previous), 'retained catalog records')


def vacancies():
    raise RuntimeError('This vacancy provider was retired. Use scripts/refresh-peso-vacancies.py --write instead.')
    coverage = read(EVIDENCE / 'coverage.json')  # Require completed date-window traversal.
    receipts = {r['source_url']: r for r in read(EVIDENCE / 'detail-receipts.json')}
    previous = {r['source_url']: r for r in read(DATA / 'verified-vacancies.json')}
    candidates = read(EVIDENCE / 'vacancy-candidates.json')
    excluded, no_skills = [], 0
    assert len(candidates) == coverage['listings']
    for index, row in enumerate(candidates):
        if index and index % 500 == 0:
            print('Validated job detail records:', index, flush=True)
        receipt = receipts.get(row['source_url'])
        assert receipt is not None, 'Wait for detail review to finish'
        if 'error' in receipt:
            excluded.append({'source_url': row['source_url'], 'reason': receipt['error']})
            continue
        markup = (EVIDENCE / receipt['file']).read_bytes().decode('utf-8')
        assert hashlib.sha256(markup.encode()).hexdigest() == receipt['sha256']
        soup = BeautifulSoup(markup, 'html.parser')
        assert soup.select_one('.jobtitle').get_text(' ', strip=True) == row['title']
        assert soup.select_one('.companytitle').get_text(' ', strip=True) == row['organization']
        postdate = soup.select_one('.postdate').get_text(' ', strip=True)
        posted = datetime.strptime(' '.join(postdate.split()[2:]), '%d %B %Y').date().isoformat()
        assert posted == row['source_posted_on'], row['source_url']
        industry_heading = next((h for h in soup.find_all('h5') if h.get_text(strip=True) == 'Industry'), None)
        industry = industry_heading.parent.select_one('.companydescription').get_text(' ', strip=True) if industry_heading else 'Not stated in source'
        # Do not inspect company advertising, unrelated navigation or personal
        # demographic requirements when mapping the actual job's skill topics.
        job_text = row['title'] + ' ' + ' '.join(x.get_text(' ', strip=True) for x in soup.select('.jobdescription')[:2])
        mapped = skills(job_text)
        no_skills += not mapped
        description = f"Official PhilJobNet vacancy. Source education entry: {row['education']}. "
        if len(industry) > 255:
            description += 'Source industry entries: ' + industry + '. '
            industry = 'Multiple source-listed sectors'
        if mapped:
            description += 'Skill topic mappings from source text: ' + ', '.join(mapped) + '. '
        else:
            description += 'No skill requirements have been mapped from this source. '
        description += 'Review the official listing for complete duties, qualifications, work arrangements and application instructions.'
        result = {k: v for k, v in row.items() if k not in ['education', 'evidence_page']}
        result.update({'industry': industry, 'skills': mapped, 'description': description, 'checked_at': receipt['checked_at']})
        for name in ['title', 'organization', 'location', 'industry', 'employment_type']:
            assert len(result[name]) <= 255, (name, result[name])
        previous[row['source_url']] = result
    write(DATA / 'verified-vacancies.json', list(previous.values()))
    write(EVIDENCE / 'excluded-vacancies.json', excluded)
    print('Vacancies:', len(candidates) - len(excluded), 'reviewed additions;', len(excluded), 'excluded;', no_skills, 'without mapped skills;', len(previous), 'retained total')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('catalog', choices=['training', 'vacancies', 'all'])
    args = parser.parse_args()
    if args.catalog in ['vacancies', 'all']:
        parser.error('Vacancy provider retired; use scripts/refresh-peso-vacancies.py --write. Training-only review remains available.')
    if args.catalog in ['training', 'all']:
        training()
    if args.catalog in ['vacancies', 'all']:
        vacancies()
