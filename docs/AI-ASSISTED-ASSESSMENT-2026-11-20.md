# Completed AI-assisted assessment

20 November 2026. At the user's request, the Codex assistant assessed actual saved model outputs and synthetic evidence. **This is an AI-assisted exploratory assessment, not independent PESO/human evaluation.** The assistant also implemented the system, saw scores/outputs and is not a blinded independent reviewer. Human reviewer count is zero. No respondent identity, accuracy or improvement percentage was invented.

## Matching judgments and computed results

The assistant assigned nine real relevance judgments, each with its own evidence/reason and separate qualification note in [the assessment data](evaluation/ai-assisted-ratings-2026-11-20.json). Across each of the three closely related English/Filipino/injection fixtures: facilitator = 2 (relevant duties, facilitation evidence incomplete); accountant = 0 (no accounting evidence supplied); attendance encoder = 3 (direct task match). These are relevance judgments, not approval of license, named-software proficiency or eligibility.

The existing real Cohere collection used the same candidates for semantic and baseline rankings. [Reproducible diagnostics](evaluation/ai-assisted-metrics-2026-11-20.json):

| Case | Semantic order | Baseline order | AI-judged nDCG@3: semantic / baseline | Recall@3 | MRR |
| --- | --- | --- | --- | --- | --- |
| heldout-en | 3, 1, 2 | 1, 2, 3 | 1.000 / 0.731 | 1.000 / 1.000 | 1.000 / 1.000 |
| heldout-fil | 3, 1, 2 | 1, 2, 3 | 1.000 / 0.731 | 1.000 / 1.000 | 1.000 / 1.000 |
| heldout-injection | 3, 1, 2 | 1, 2, 3 | 1.000 / 0.731 | 1.000 / 1.000 | 1.000 / 1.000 |

These numbers are **not accuracy** or evidence of effectiveness among actual applicants. Recall@3 is structurally trivial with only three candidates. Baseline ties use candidate ID; tie handling affects nDCG. The cases share the same occupation pattern and do not measure generalization or reviewer agreement. The formerly held-out historical outputs were examined for corrective development here, so they are not unused holdouts for subsequent changes.

```powershell
python scripts/ai-assisted-score.py --report backend/storage/app/private/ai-evaluations/20261119-212103-heldout.json --assessment docs/evaluation/ai-assisted-ratings-2026-11-20.json --output docs/evaluation/ai-assisted-metrics-2026-11-20.json
```

The separate human-rating calculator and blank review forms were not filled with these AI labels. Source-report/assessment SHA256 hashes are retained in the diagnostic output.

## Findings for all four features

| Feature | Actual observation | Assessment |
| --- | --- | --- |
| Semantic matching | Encoder ranks ahead of facilitator/accountant in all three saved cases. Explicit license/named-software evidence remains unverified. | Aligned with the assistant's relevance judgments on this tiny set; not human validation. |
| Career adviser | Source IDs/quotes and supplied synthetic training IDs align. Filipino “kaunting karanasan” adds an unprovided amount; “lisensyadong kapasyahan” is poor wording. Some “enroll” advice needs an availability check first. | Mixed grounding/language quality; synthetic training records are not actual intake slots. |
| Résumé review | Historical English prose turns “No teaching license is declared” into lack/disqualification. Filipino prose infers Excel skill from generic spreadsheets. No accepted rewritten statements in these held-out cases. | Unsupported factual/qualification claims found. No basis for claiming rewrite effectiveness. |
| Mock interview | Actual latest bilingual route sessions finished five answers with authentic evidence quotes and final summaries, but repeated the same question on every turn. Older feedback also inferred Excel use. | Sequence/schema passes did not establish dialogue quality. Novel follow-up and writing-scope checks were added. |

Complete claim-level explanations, severities and evidence are in the assessment JSON. This report does not reclassify an earlier failure as a pass.

## Corrective changes and verification

Writing feedback now rejects explicit eligibility/disqualification decisions and specified license-absence claims derived from “not stated” evidence. Prompts explicitly distinguish generic spreadsheets from named Excel use. Interview input includes the latest answer, prior questions, turn count and a missing-detail focus; exact repeated questions receive one real-model retry, then an explicit error without consuming the answer/version. Model inference still generates the actual questions/feedback; no canned question responses are substituted. Exact-repeat and phrase guards cannot prove semantic novelty or factual entailment.

The first corrective live run failed both languages on repeated questions; a second passed English and failed Filipino at answer four. Those failures remain in private synthetic artifacts. Final rerun results are recorded only after execution. Reused bilingual integration fixtures are regression checks, not a new held-out study. Independent qualified human judgments and unused study cases remain necessary for a formal human-validation claim.

Final corrective rerun: **2 passed, 44 assertions**, actual Cohere English/Filipino inference, 136.42 seconds. Each completed session contains five questions and **five unique question strings**, followed by a final summary. Actual synthetic artifacts: `.local/live-ai-verification/20261120-110651-en.json` and `20261120-110815-fil.json`. A duplicate response may require the one bounded model retry; this increases latency/provider usage. String uniqueness is not proof of semantic novelty. The entire backend suite passed **121 tests, 6,071 assertions**, with the two external-model tests skipped in that separate suite. Five Python evaluation-tool tests and the frontend build passed. No new independent human labels were collected.
