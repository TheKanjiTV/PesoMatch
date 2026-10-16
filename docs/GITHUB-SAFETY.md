# Source repository and private local files

Prepared on 16 October 2026 for the user's TheKanjiTV GitHub account. The application repository root is `ScholarMatch`, not its parent workspace. The sibling `../impeccable` checkout is outside the repository and is not uploaded. Ignore rules also protect an Impeccable checkout accidentally placed inside this repository.

## Included

Frontend/backend source, migrations/models, tests, safe `.env.example`, lockfiles, public-source catalog JSON, Android source/Gradle wrapper, runtime images/fonts and their existing rights inventory, and project documentation. No default privileged account credentials are seeded. Existing history is preserved; no history rewrite or credential rotation was performed.

## Excluded

- Live `.env` files, application/database/API credentials and Composer auth files.
- Private user uploads, résumé documents, sessions, logs, local database files/dumps and backups.
- `node_modules`, Laravel `vendor`, Vite `dist`, caches, test reports/screenshots and `.local` tools/evidence.
- APK/build outputs, native signing keys/keystores and local SDK configuration.
- Impeccable and local agent/tool state; retired Figma automation is not part of the current source snapshot.

The current local employer/admin accounts stay in the local MySQL database. A clone needs its own environment, application key, database setup and role provisioning; repository access does not grant platform administrator access. Never commit a copied real environment or regenerate the application key of an existing encrypted database.

The repository defaults to **private**. Private visibility is separate from secret hygiene: ignored credentials must stay out even in private commits. Ignore rules do not erase historical commits; current history and the exact staged blobs are inspected before publication. Findings are reported without printing credential values. Unknown asset rights and deployment/legal requirements remain documented in the existing audit reports; uploading a private source backup does not certify public release readiness.

All current runtime assets are small enough for ordinary Git, so inherited blanket LFS rules were removed before staging. The Gradle wrapper and runtime images/fonts can be checked out without Git LFS. No local data or assets were deleted.

## Publication checks

The prepared snapshot contains 424 tracked files, about 41.7 MB before Git compression; the largest individual asset is under 3 MB. Credential-pattern checks and exact comparisons with current local environment/account secrets found no unreviewed matches in the staged files or the three prior commits (37 historical blobs). One reserved-domain credential URL is an intentional Android rejection test, reviewed as a fixture. No real credential values are printed or recorded in the audit report.

Production build, 64 isolated Laravel tests (795 assertions), six account-client tests and staged whitespace checks passed on 16 October. The database, application key and account passwords were not changed. New commit identity uses the verified GitHub account's noreply address. These checks do not guarantee that every possible secret format or software vulnerability has been detected.
