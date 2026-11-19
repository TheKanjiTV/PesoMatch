# Four-feature AI evaluation — live collection complete, human review pending

19 November 2026. Real Cohere outputs were collected for three development and three held-out synthetic cases, and two full authenticated five-answer interview/workspace sessions in English and Filipino. Human relevance judgments, participants, reviewer ratings, accuracy and improvement percentages have not been collected. Automated mock tests check application behavior; their pass counts are not AI effectiveness results. See [dated collection results and limitations](AI-ACTIVATION-2026-11-19.md).

## Fixed inputs and collection

`backend/database/data/ai-evaluation-cases.json` contains separately identified development and held-out synthetic cases in English and Filipino, including document prompt injection, missing credentials and explicit license evidence. These are evaluation fixtures, not actual applicants, providers or available training places. The synthetic training IDs belong only to the evaluation context; production advisers retrieve actual database records and validate returned IDs.

Freeze/hash the fixture file and prompts before running held-out cases. Do not adjust prompts, pooling or thresholds after viewing held-out results; create a new version and a new unused holdout if adjustment is necessary. Merely separating small synthetic cases is not evidence of generalization. Add independently authored PESO cases with appropriate consent before making effectiveness claims.

```bash
cd backend
php artisan peso:ai-evaluate                    # no network, explains setup
php artisan peso:ai-evaluate --live --split=development
# Freeze implementation, record revision/prompt/fixture hashes; then:
php artisan peso:ai-evaluate --live --split=heldout
```

The live command uses real Cohere inference and writes synthetic outputs under private `storage/app/private/ai-evaluations/`. It records model IDs, fixture hash, time, language and failures; reviewer results stay null. It does not use private applicant records or change the live catalog. Each case collects semantic and baseline scores on the same candidates, adviser output, constrained résumé edits, an interview question and answer-based follow-up feedback. Full five-answer completion also passed separate opt-in real-model route tests in English and Filipino. Ownership, version conflicts, expired sessions and outage handling are covered separately with mocked application tests. Independent review of all collected outputs remains required.

## Independent human review

Recruit PESO personnel or qualified employment/career reviewers; record actual reviewer role, experience, consent, case ID and date. Reviewers should not author the prompts they score. Present profile and vacancy candidates in randomized order without method names or scores. Obtain independent relevance grades **0 unrelated, 1 partial, 2 relevant, 3 strongly relevant**, with a reason and separate explicit-qualification evidence notes. Multiple reviewers should rate independently before disagreements are discussed.

Use the same relevance judgments and candidate set for both rankings. Report nDCG@3, Recall@3 for grades >=2, and mean reciprocal rank for the first grade >=2; handle zero-relevant cases explicitly. Include per-language results, ties, case counts, failures and reviewer disagreement. Do not interpret similarity as hiring probability or treat explicit-license eligibility as semantic relevance. This small fixture set is preparatory, not an accuracy benchmark.

For the other features, reviewers record a verdict (supported / unsupported / unclear) for each factual statement, exact evidence or mismatch, severity and correction:

| Feature | Review evidence | Required failure checks |
| --- | --- | --- |
| Career adviser | Quoted profile/résumé evidence, stated vacancy requirements, actual supplied training records | Missing evidence described as not stated; no invented skills, eligibility, programs, dates or slots; questions useful; steps relevant; IDs real and accessible |
| Résumé review | Original statement, additional user facts, revision and reason | No fabricated credentials/achievements/numbers; negation retained; meaning preserved; questions before unsupported detail; original PDF unchanged; acceptance/rejection works |
| Mock interview | Selected vacancy, declared experience, actual answer and follow-up | One question at a time; question relevant to answer; all four rubric scores justified; no invented sample experience, hiring probability or personality/honesty/emotion inference; summary faithful |

Review English and Filipino separately for meaning, clarity, grounded claims and respectful wording. Include code switching, sparse profiles, scanned/unreadable PDFs, expired licenses, negated statements, model outage, malformed outputs, adversarial document instructions and a full five-question dialogue. Record refusals and model errors as outcomes; do not drop them from reporting.

## Blank review record

Copy this per case/reviewer, leaving fields blank until actually reviewed:

```json
{
  "case_id": "",
  "reviewer_id": "",
  "reviewer_role_and_experience": "",
  "reviewed_at": null,
  "language": "",
  "candidate_relevance": [],
  "adviser_claim_verdicts": [],
  "resume_fact_preservation_verdicts": [],
  "interview_feedback_verdicts": [],
  "language_quality_notes": "",
  "failures_and_limitations": [],
  "independent_review_completed": false
}
```

Current result: **real model collection completed; independent human review and ranking metrics pending**. Prompt instructions, exact-quote checks, source-ID allowlists, vocabulary/number/negation guards and output schemas reduce errors; they do not establish semantic truth or prove prompt-injection resistance. External model snapshots and platform behavior can drift. Keep collection dates and actual response metadata with any later study.

## Reviewer packet and scoring tool (20 November)

A blinded packet with **9 candidate rows across 3 held-out cases** is prepared privately at `.local/ai-human-review/`. `blind-matching.md` omits model methods, scores and ranking order. Give that file and `matching-ratings.csv` to each actual qualified reviewer before showing the separate `grounding-writing-interview.md` outputs. The factual-review CSV supports claim-level findings for adviser, resume and interview feedback. No fields are prefilled with invented ratings.

```powershell
python scripts/ai-human-review.py prepare --report backend/storage/app/private/ai-evaluations/20261119-212103-heldout.json --output .local/ai-human-review
python scripts/ai-human-review.py score --report backend/storage/app/private/ai-evaluations/20261119-212103-heldout.json --ratings .local/ai-human-review/completed-ratings.csv --output .local/ai-human-review/metrics.json
python -m unittest discover -s tests/evaluation
```

The calculator checks the original fixture hash, refuses blank/incomplete/duplicate/unknown ratings and requires actual reviewer role/date/reasons and an independence confirmation. It produces per-case/per-reviewer nDCG@3, Recall@3 and MRR, separating zero-relevant cases as null. It does not manufacture accuracy or a population-level improvement claim. Retain original review records; tool acceptance does not independently verify a reviewer's identity or qualifications. Current human results remain pending because no actual independent labels have been provided.

### November 20 interview protocol change

Production testing found that a model could return rubric feedback in an opening response before the applicant had answered. The final opening contract now requests only one model-generated question; empty feedback/summary are server-owned initial state. The model still generates all answer-based rubric feedback and final summaries. The original November 19 interview holdout outputs predate this protocol change and do not validate that final opening contract. Matching/adviser/resume implementation and the matching reviewer packet are unchanged. Reserve new unused interview cases for a formal final-protocol study; do not relabel repeated old cases as a new holdout. Bilingual full-dialogue integration checks passed again after this change; these remain separate from human evaluation.
