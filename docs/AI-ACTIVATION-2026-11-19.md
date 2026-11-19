# Local AI activation and SSH evidence — 19 November 2026

The four features are operational **locally** with genuine pretrained inference. SSH key authentication and the private Hostinger source workflow are ready. Independent employment relevance/factual/language validation is pending. No commit, push, production migration or live deployment was performed.

## Models and configuration

| Exact provider model | Role | Observed access |
| --- | --- | --- |
| `embed-multilingual-v3.0` | 1,024-dimensional multilingual profile/vacancy semantic embeddings | Real embedding requests succeeded; 465 eligible public vacancy vectors indexed |
| `command-a-03-2025` | Career adviser, vacancy-specific résumé writing feedback, text mock interview | Real structured responses collected for all three workflows in English and Filipino |

This is pretrained model integration; no model training or fine-tuning was performed. Semantic cosine is relevance, not qualification approval or a hiring probability. The 75% declared-skill / 25% TF-IDF method remains a separately labeled comparator.

The existing free trial key from the user's Cohere account was used. No paid plan or replacement key was created. The key is saved only in the ignored local backend `.env` with `AI_ENABLED=true`; it is absent from frontend configuration and repository source. The temporary key-import file was removed. Trial access is rate limited and is presented by the provider as non-commercial; it is not production service assurance. Hostinger's live backend environment was not changed.

`php artisan peso:ai-configure` provides a hidden key prompt, verifies both model endpoints before writing, preserves the existing APP_KEY/database settings and encrypts the previous environment in private storage. Use `--check` to verify without saving. No secret is emitted by the command. See [complete setup](AI-IMPLEMENTATION.md).

## Actual checks and collected outputs

| Check | Result | Scope |
| --- | --- | --- |
| `php artisan peso:ai-configure --check` | Both exact model endpoints succeeded | Real Cohere inference, synthetic connectivity inputs |
| `php artisan peso:ai-index` | 465 eligible public vacancy vectors indexed | Real embedding inference; encrypted cache; excludes samples/unavailable records |
| Repeat `peso:ai-index` | Zero updates | Cache reuse for unchanged content |
| Default `php artisan test --compact` | 113 passed, 2 skipped; 6,029 assertions | SQLite memory database; AI HTTP mocked; opt-in live tests skipped |
| `PESO_LIVE_AI=1 php artisan test --filter=LiveAiEmploymentTest` | 2 passed; 44 assertions | Real Cohere through authenticated routes, synthetic profile/excerpt/vacancy/training, English and Filipino, all five answers and final summary |
| `pnpm build` | Passed | Existing large Three.js chunk warning remains |
| `revision-workflows.spec.js` | 5 passed | Isolated browser API fixtures; forms/details/status/participants/consent/mobile/five-answer UI; not live inference |
| SSH runtime check, including child Bash | Passed | PHP 8.4.27, Node 24.22.3, Corepack pnpm 10.29.3 |

The live route test uses only a synthetic extracted excerpt record; it does not claim that a real applicant PDF was uploaded or reviewed in that test. Existing secure PDF extraction/ownership checks are tested separately. Live route checks retain authentication/ownership and disable throttle middleware only for the isolated synthetic test; normal application limits remain active.

Private collection artifacts (ignored, never published):

- Latest development collection: `backend/storage/app/private/ai-evaluations/20261119-211647-development.json` — three cases (English, Filipino, document injection), all four feature outputs collected. One unsafe Filipino résumé rewrite was withheld by the system guard.
- Held-out collection: `backend/storage/app/private/ai-evaluations/20261119-212103-heldout.json` — three distinct cases; all four feature outputs collected without provider/validation failures in this run. Each compares semantic and baseline scores on the same candidate set. No rejected résumé rewrites in this run. This does not establish that every accepted claim is correct.
- Full English session: `.local/live-ai-verification/20261119-212655-en.json`.
- Full Filipino session: `.local/live-ai-verification/20261119-212801-fil.json`.
- Pre-holdout source/fixture hashes: `.local/live-ai-verification/freeze-before-heldout.json`. Fixture SHA-256: `b97e705742ebb9a9e13eb1ab4af44b7aec59a7f84775cd5fb878cbfa34ce4201`.

Prompts/fixtures were fixed before the held-out collection; no held-out-driven prompt or threshold tuning was performed. Later formatting and the separately tested fifth-answer-only schema branch changed source bytes, so the freeze file is a pre-collection snapshot, not a claim that every final source hash is identical. The held-out cases exercise an opening question and one answer-based follow-up; the full five-answer sessions are separate integration verification. A later model/prompt/threshold revision requires a new unused holdout before claiming generalization.

Earlier failed development attempts and synthetic response records are retained privately. They are not counted as successful cases. These collection counts are not human ratings, accuracy, measured improvement or real applicant study results.

## Changes required by real inference

- Cohere rejected JSON Schema integer minimum/maximum constraints. The interview schema now uses an integer enum 1–4, with backend numeric range checks retained.
- Adviser evidence IDs are constrained to supplied records. The server hydrates exact evidence quotes from its own source records; it does not rely on model transcription. Training IDs remain restricted to the actual candidate records and server-built links.
- A model rewrite introduced unsupported wording. Each failing suggestion is now withheld individually, with a visible system-validation count. Safe feedback/questions remain. Original-file preservation, user accept/reject, vocabulary/number/negation guards remain in place. These guards cannot prove entailment.
- The new interview response now refreshes database defaults so the client receives initial state version 1. The final-answer schema requires an empty next question; the server controls completion after five answers while the model produces feedback and summary.
- Bulk console embedding requests are paced. Content hashes prevent unchanged vacancy/profile content being sent repeatedly. Expiry cleanup and changed-vacancy indexing are scheduled in Laravel; the Hostinger cron has not been installed by this task.

## SSH and future update workflow

The registered **PesoMatch laptop** public key was saved after explicit user approval. The private key remains on the laptop. The destination matches the authenticated hPanel account; the locally stored host key is enforced on subsequent connections.

```powershell
ssh pesomatch-hostinger
```

Then, in Hostinger Bash:

```bash
. ~/apps/pesomatch/runtime.sh
git status --short
# After local changes are reviewed, committed and pushed:
git pull --ff-only
```

The private source checkout is `/home/u636932635/apps/pesomatch/PesoMatch`, initially clean at GitHub commit `39dbef65c76d72a5f544859517c3893a1e8e38b8`. PHP/Node/pnpm are available after sourcing the runtime loader. Existing production Composer platform requirements pass under PHP 8.4.

The live backend is still `/home/u636932635/domains/pesomatch.site/app/pesomatch`; live `public_html` is still a real directory. Pull/build in the new checkout does not automatically replace either. The prepared guarded release workflow still needs a one-time staged mapping with preserved APP_KEY, private résumés/storage and database backups. No production release or remote AI check is claimed. See [SSH commands, paths and release preparation](HOSTINGER-SSH-WORKFLOW.md).

## Human evaluation still required

No independent reviewer relevance judgments, factual-preservation verdicts, language ratings or employment outcomes were collected. Therefore nDCG/Recall/MRR, accuracy and improvement percentages remain uncomputed. [The protocol](AI-EVALUATION-PROTOCOL.md) supplies blind same-candidate comparisons and blank records for qualified PESO reviewers. The synthetic inputs are too small to establish generalization. Outages, trial quotas, strict paraphrase rejection, missing profile evidence, 6,000-character excerpts and chunk pooling remain material limitations.

## Maikling defense explanation

“Gumagamit ang semantic job matching ng pretrained multilingual embedding model para ikumpara ang kahulugan ng profile at vacancy. Hiwalay pa rin ang documentary qualification review at ang lumang 75/25 baseline. Ang pretrained language model naman ay ginagamit sa career advice, résumé writing review at text interview practice. May consent, tunay na database training links, evidence checks at user review. Hindi kami ang nag-train ng models. Nasubukan ang tunay na inference sa English at Filipino, may hiwalay na held-out synthetic cases at kumpletong five-answer interviews. Pending pa ang independent PESO evaluation, kaya wala pa kaming accuracy o improvement claim.”
