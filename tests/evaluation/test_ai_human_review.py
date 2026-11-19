import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('review', Path(__file__).resolve().parents[2] / 'scripts/ai-human-review.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


class RankingMetricsTest(unittest.TestCase):
    def test_independent_labels_distinguish_reversed_rankings(self):
        labels = {'a': 3, 'b': 2, 'c': 0, 'd': 0}
        perfect = review.metrics(['a', 'b', 'c', 'd'], labels)
        poor = review.metrics(['d', 'c', 'b', 'a'], labels)
        self.assertEqual(perfect['ndcg_at_3'], 1)
        self.assertEqual(perfect['mrr'], 1)
        self.assertEqual(poor['recall_at_3'], 0.5)
        self.assertAlmostEqual(poor['mrr'], 1/3)
        self.assertLess(poor['ndcg_at_3'], perfect['ndcg_at_3'])

    def test_zero_relevant_case_does_not_fabricate_zero_accuracy(self):
        result = review.metrics(['a', 'b'], {'a': 0, 'b': 1})
        self.assertTrue(result['zero_relevant'])
        self.assertIsNone(result['ndcg_at_3'])
        self.assertIsNone(result['recall_at_3'])
        self.assertIsNone(result['mrr'])

    def test_blank_human_review_is_rejected(self):
        import tempfile
        import json
        import hashlib
        import csv
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'fixtures.json').write_text(json.dumps({'heldout': [{'id': 'case', 'candidates': [{'id': 1}]}]}))
            (root/'report.json').write_text(json.dumps({'fixture_sha256': hashlib.sha256((root/'fixtures.json').read_bytes()).hexdigest(), 'source': 'live Cohere inference on synthetic inputs', 'split': 'heldout', 'cases': [{'case_id': 'case', 'language': 'en', 'features': {'matching': {'status': 'live_output_collected', 'scores': [{'candidate_id': 1, 'semantic_similarity': 0.5, 'baseline_score': 50}]}}}]}))
            with (root/'ratings.csv').open('w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=review.FIELDS)
                writer.writeheader()
                writer.writerow({'case_id': 'case', 'candidate_id': '1'})
            with self.assertRaisesRegex(ValueError, 'Pending'):
                review.score(root/'report.json', root/'fixtures.json', root/'ratings.csv')
