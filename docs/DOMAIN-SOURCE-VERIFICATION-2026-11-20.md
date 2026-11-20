# Domain folder and Git source verification

20 November 2026. The stale November 15 domain `app/pesomatch` copy has been archived outside the domain. A fresh Git clone of implementation revision `caccc2b043e154b52b9e3996b09744f24a17d8e8` now occupies the **actual** `/home/u636932635/domains/pesomatch.site/app` folder visible in hPanel File Manager. This is not a navigation shortcut to a separate source folder. The subsequent documentation/rollback-flag correction commit is synchronized with `git pull --ff-only`; it does not change the tested application payload.

## Evidence collected after publication

- Local, GitHub main and Hostinger domain checkout had identical implementation commit `caccc2b043e154b52b9e3996b09744f24a17d8e8`, tree `7edf217b1f06b024c8fce9614067ff8941065fca`, 541 tracked files, and a clean actual working tree. This report adds one tracked documentation file in the follow-up commit.
- `app/.git`, `app/.gitignore`, React `src/`, Laravel `backend/`, scripts, tests and docs are physically in the domain folder. `backend/.env` is an actual ignored regular file, mode 0600, not an external symlink. Hidden-file display is required in File Manager to see dotfiles.
- The running backend resolves to `domains/pesomatch.site/app/backend`. The runtime loader opens the domain checkout. The existing scheduler follows `~/apps/pesomatch/current/backend`, which resolves there too.
- All five existing private files matched their archived pre-move bytes by SHA256, without printing their names or contents. APP_KEY and all protected database counts were preserved. Counts: 17 users, 12 profiles, 1 résumé document, 3,199 vacancies, 22,089 training programs, 5 referrals, 5 enrollments, 0 placements and 1 outcome. All 38 foreign keys checked, zero orphan references. Private PDF extractor remained available.
- Both exact Cohere models passed actual remote configuration inference checks; unchanged vacancy vectors were reused. New caches were generated after the folder switch, avoiding staging-directory paths in cached configuration.
- Live index SHA256 matched `app/dist/index.html`: `40a74574942085056b2d3ae1f9c5d1c4f1dcbe7cd2b2f0b70893e50839d17152`.
- HTTPS health and AI workspace: 200. Unauthenticated `/api/auth/user`: 401. `.env`, `.git/config`, `/backend/.env`: 403. Missing asset: 404. Existing Android release metadata: 200. Android downloads, domain verification files and prior hashed assets were retained.

The full old `app` and `public_html`, environment, database dump and shared-storage snapshot are private at `~/apps/pesomatch/backups/domain-caccc2b043e154b52b9e3996b09744f24a17d8e8-20261120T030941Z`. No user account, database row, key or résumé was intentionally deleted. The redundant old domain source was removed from the visible domain location by archiving it.

GitHub source and **tracked** domain source are identical. Hostinger additionally contains ignored production `.env`, persisted storage, installed dependencies and generated build output; those must not be uploaded to GitHub. `public_html` contains the published build and a protected PHP entry shim, not the private source repository. See [the exact folder map and SSH commands](../HOSTINGER.md).

## AI assessment and checks

The assistant's completed [AI-assisted assessment](AI-ASSISTED-ASSESSMENT-2026-11-20.md) contains nine real AI judgments and actual computed exploratory metrics. It is not a fabricated independent human review. Historical factual/wording and repeated-question issues remain documented, with corrective guards and rerun results. The historical cases are no longer unused holdouts for these corrections.

Final local checks: 121 backend tests / 6,071 assertions; separate actual English/Filipino model tests 2 passed / 44 assertions, with five unique questions in each completed five-answer session; 5 Python evaluation tests; frontend build passed. Earlier corrected UI/profile changes passed 14 browser tests; they were not relabeled as live-model or human evaluation. The desktop tool's prior PowerShell-app restriction was not bypassed: the actual clone/build/switch ran through the authorized SSH terminal in Codex.
