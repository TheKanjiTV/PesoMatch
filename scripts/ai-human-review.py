"""Prepare blinded synthetic review materials; compute metrics only from actual reviewer labels."""
import argparse
import csv
import hashlib
import json
import math
import random
from collections import defaultdict
from pathlib import Path

FIELDS = ['reviewer_id', 'reviewer_role_and_experience', 'reviewed_at', 'independent_review_confirmed', 'case_id', 'candidate_id', 'relevance_grade', 'reason', 'qualification_evidence_notes']


def metrics(order, grades):
    relevant = {key for key, grade in grades.items() if grade >= 2}
    if not relevant:
        return {'ndcg_at_3': None, 'recall_at_3': None, 'mrr': None, 'zero_relevant': True}
    def dcg(items):
        return sum((2 ** grades[key] - 1) / math.log2(i + 2) for i, key in enumerate(items[:3]))
    ideal = sorted(grades, key=lambda key: (-grades[key], key))
    return {'ndcg_at_3': dcg(order) / dcg(ideal), 'recall_at_3': len(relevant.intersection(order[:3])) / len(relevant), 'mrr': next(1 / (i + 1) for i, key in enumerate(order) if key in relevant), 'zero_relevant': False}


def load_inputs(report_path, fixtures_path):
    report = json.loads(Path(report_path).read_text(encoding='utf-8'))
    fixtures = json.loads(Path(fixtures_path).read_text(encoding='utf-8'))
    if hashlib.sha256(Path(fixtures_path).read_bytes()).hexdigest() != report.get('fixture_sha256'):
        raise ValueError('Fixture hash differs from the collected report; do not score changed cases.')
    cases = {case['id']: case for case in fixtures[report['split']]}
    if report['source'] != 'live Cohere inference on synthetic inputs':
        raise ValueError('Use a real synthetic inference collection, not mocked scores.')
    if any(c['features']['matching']['status'] != 'live_output_collected' for c in report['cases']):
        raise ValueError('Matching collection is incomplete. Retain and report failures separately.')
    return report, cases


def prepare(report_path, fixtures_path, directory):
    report, cases = load_inputs(report_path, fixtures_path)
    out = Path(directory)
    out.mkdir(parents=True, exist_ok=True)
    rows = [(c['case_id'], candidate) for c in report['cases'] for candidate in cases[c['case_id']]['candidates']]
    random.SystemRandom().shuffle(rows)
    # Scores, methods and ranking order are omitted from the blinded packet.
    packet = ['# Independent synthetic candidate relevance review', '', 'Do this before reading model scores or AI outputs. Grade each candidate independently: 0 unrelated, 1 partial, 2 relevant, 3 strongly relevant. Qualification evidence is separate. Do not infer absent skills from missing information. Record your actual role, review date and reasons. Do not mark independent if you authored the prompts or ratings are model-generated.', '']
    for case_id, candidate in rows:
        case = cases[case_id]
        packet += ['## '+case_id+' / candidate '+str(candidate['id']), '', 'Profile evidence:', json.dumps(case['profile_evidence'], ensure_ascii=False, indent=2), '', 'Vacancy:', json.dumps(candidate, ensure_ascii=False, indent=2), '']
    (out/'blind-matching.md').write_text('\n'.join(packet), encoding='utf-8')
    with (out/'matching-ratings.csv').open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS); writer.writeheader()
        for case_id, candidate in rows:
            writer.writerow({'case_id': case_id, 'candidate_id': candidate['id']})
    # Separate file: review only AFTER blind relevance grades are saved.
    output = ['# Grounding, writing and interview review', '', 'All inputs are synthetic. Do not treat these as actual applicants or verified training intakes. Record supported / unsupported / unclear per claim, evidence, severity, correction and language quality. Feedback is not qualification approval.', '']
    verdict_fields = ['reviewer_id', 'reviewer_role_and_experience', 'reviewed_at', 'case_id', 'feature', 'claim_or_suggestion', 'verdict', 'evidence_or_mismatch', 'severity', 'correction', 'language_quality_notes']
    with (out/'factual-review.csv').open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=verdict_fields); writer.writeheader()
        for row in report['cases']:
            case = cases[row['case_id']]
            output += ['## '+row['case_id'], '', 'Supplied facts, selected vacancy, resume, training and answer:', '```json', json.dumps({k: case[k] for k in ['profile_evidence', 'vacancy', 'resume', 'additional_facts', 'training_records', 'interview_answer']}, ensure_ascii=False, indent=2), '```', '']
            for feature in ['adviser', 'resume', 'interview']:
                output += ['### '+feature, '```json', json.dumps(row['features'][feature], ensure_ascii=False, indent=2), '```', '']
                writer.writerow({'case_id': row['case_id'], 'feature': feature})
    (out/'grounding-writing-interview.md').write_text('\n'.join(output), encoding='utf-8')
    (out/'README.md').write_text('Independent review is pending. Keep blind-matching.md separate from model outputs until relevance grades are saved. Copy matching-ratings.csv per actual reviewer and combine completed rows before scoring. The factual-review template requires one row per reviewed claim or suggestion; add rows as needed. No ratings or percentages are prefilled. These small synthetic cases cannot establish population-level effectiveness.\n', encoding='utf-8')
    return {'review_status': 'pending actual independent ratings', 'candidate_rows': len(rows), 'packet': str(out)}


def score(report_path, fixtures_path, ratings_path):
    report, cases = load_inputs(report_path, fixtures_path)
    expected = {(row['case_id'], str(candidate['id'])) for row in report['cases'] for candidate in cases[row['case_id']]['candidates']}
    grouped = defaultdict(dict)
    with Path(ratings_path).open(newline='', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            if not all(row.get(field, '').strip() for field in ['reviewer_id', 'reviewer_role_and_experience', 'reviewed_at', 'reason']):
                raise ValueError('Pending: actual reviewer identity/role/date/reasons are required; no metrics computed.')
            if row.get('independent_review_confirmed', '').strip().lower() != 'yes':
                raise ValueError('Pending: the actual reviewer must confirm independence; do not use model ratings.')
            key = (row['case_id'], row['candidate_id'])
            if key not in expected or key in grouped[row['reviewer_id']]:
                raise ValueError('Unknown or duplicate candidate rating.')
            if row['relevance_grade'] not in ['0', '1', '2', '3']:
                raise ValueError('Pending: provide an actual relevance grade from 0 to 3.')
            grouped[row['reviewer_id']][key] = int(row['relevance_grade'])
    if not grouped or any(set(labels) != expected for labels in grouped.values()):
        raise ValueError('Pending: each reviewer must independently grade the complete candidate set.')
    results = []
    for reviewer, labels in grouped.items():
        for row in report['cases']:
            case_id = row['case_id']
            grades = {candidate: grade for (case, candidate), grade in labels.items() if case == case_id}
            scores = row['features']['matching']['scores']
            item = {'reviewer_id': reviewer, 'case_id': case_id, 'language': row['language']}
            for method, column in [('semantic', 'semantic_similarity'), ('baseline', 'baseline_score')]:
                ranking = sorted(scores, key=lambda s: (-s[column], s['candidate_id']))
                item[method] = metrics([str(s['candidate_id']) for s in ranking], grades)
            results.append(item)
    return {'source': 'user-supplied independent reviewer labels; retain original signed review records', 'reviewer_count': len(grouped), 'per_case_per_reviewer': results, 'accuracy': None, 'limitations': 'Small synthetic cases; no hiring prediction, significance or population-level improvement claim. Factual/language reviews require separate human analysis.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'score'])
    parser.add_argument('--report', required=True)
    parser.add_argument('--fixtures', default='backend/database/data/ai-evaluation-cases.json')
    parser.add_argument('--output', required=True)
    parser.add_argument('--ratings')
    args = parser.parse_args()
    try:
        if args.action == 'prepare':
            result = prepare(args.report, args.fixtures, args.output)
        else:
            if not args.ratings: parser.error('--ratings is required for score')
            result = score(args.report, args.fixtures, args.ratings)
            Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, KeyError, OSError) as exc:
        parser.exit(1, str(exc)+'\n')
