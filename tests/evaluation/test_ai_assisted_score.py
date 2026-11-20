import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('assisted_score', Path(__file__).resolve().parents[2] / 'scripts/ai-assisted-score.py')
assisted = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assisted)


class AssistedReviewBoundaryTest(unittest.TestCase):
    def check_assessment(self, assessment):
        report = {'cases': [{'case_id': 'synthetic', 'language': 'en', 'features': {'matching': {'scores': [{'candidate_id': 1, 'semantic_similarity': .5, 'baseline_score': 0}]}}}]}
        cases = {'synthetic': {'candidates': [{'id': 1}]}}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'report.json').write_text(json.dumps(report))
            (root / 'assessment.json').write_text(json.dumps(assessment))
            with patch.object(assisted.module, 'load_inputs', return_value=(report, cases)):
                return assisted.score(root / 'report.json', root / 'assessment.json', 'unused-fixture')

    def test_ai_judgments_cannot_be_labeled_independent_human_review(self):
        with self.assertRaisesRegex(ValueError, 'AI-assisted'):
            self.check_assessment({'reviewer_type': 'AI assistant', 'independent_human_review': True, 'ratings': []})

    def test_zero_relevant_ai_case_keeps_accuracy_null_and_no_human_reviewers(self):
        result = self.check_assessment({'reviewer_type': 'AI assistant', 'independent_human_review': False, 'ratings': [{'case_id': 'synthetic', 'candidate_id': 1, 'relevance_grade': 0, 'reason': 'Synthetic boundary test only.'}]})
        self.assertEqual(0, result['human_reviewer_count'])
        self.assertFalse(result['independent_human_review'])
        self.assertIsNone(result['accuracy'])
        self.assertIsNone(result['per_case'][0]['semantic']['ndcg_at_3'])
