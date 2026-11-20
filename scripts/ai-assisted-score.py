"""Compute explicitly AI-judged diagnostics without touching human review ratings."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location('human_review_metrics', Path(__file__).with_name('ai-human-review.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def score(report_path, assessment_path, fixtures_path):
    report, cases = module.load_inputs(report_path, fixtures_path)
    assessment = json.loads(Path(assessment_path).read_text(encoding='utf-8'))
    if assessment.get('reviewer_type') != 'AI assistant' or assessment.get('independent_human_review') is not False:
        raise ValueError('This calculator accepts explicitly AI-assisted judgments only; use the separate independent review process for human ratings.')
    labels = {}
    for row in assessment['ratings']:
        key = (row['case_id'], str(row['candidate_id']))
        if key in labels or row['relevance_grade'] not in [0, 1, 2, 3] or not row['reason'].strip():
            raise ValueError('Duplicate or incomplete AI assessment.')
        labels[key] = row['relevance_grade']
    expected = {(row['case_id'], str(candidate['id'])) for row in report['cases'] for candidate in cases[row['case_id']]['candidates']}
    if set(labels) != expected:
        raise ValueError('AI labels do not match the complete collected candidate set.')
    results = []
    for row in report['cases']:
        grades = {candidate: grade for (case, candidate), grade in labels.items() if case == row['case_id']}
        result = {'case_id': row['case_id'], 'language': row['language']}
        for method, field in [('semantic', 'semantic_similarity'), ('baseline', 'baseline_score')]:
            ranking = sorted(row['features']['matching']['scores'], key=lambda candidate: (-candidate[field], candidate['candidate_id']))
            result[method] = {'order': [candidate['candidate_id'] for candidate in ranking], **module.metrics([str(candidate['candidate_id']) for candidate in ranking], grades)}
        results.append(result)
    return {'evaluation_type': 'exploratory AI-judged ranking diagnostics', 'independent_human_review': False, 'human_reviewer_count': 0, 'accuracy': None, 'population_improvement_percentage': None, 'report_sha256': hashlib.sha256(Path(report_path).read_bytes()).hexdigest(), 'assessment_sha256': hashlib.sha256(Path(assessment_path).read_bytes()).hexdigest(), 'per_case': results, 'limitations': ['Nine AI labels, three closely related synthetic cases; the assistant also implemented the system and saw outputs.', 'Three candidates make Recall@3 structurally trivial here. Baseline ties are broken by candidate ID.', 'The reviewed historical cases are not an unused holdout for the subsequent corrective changes.', 'These numbers are not PESO staff judgments, hiring probabilities, accuracy or evidence of population improvement.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', required=True)
    parser.add_argument('--assessment', required=True)
    parser.add_argument('--fixtures', default='backend/database/data/ai-evaluation-cases.json')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    result = score(args.report, args.assessment, args.fixtures)
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))
