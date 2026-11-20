# Hostinger Git + SSH release workflow

20 November 2026. Laptop key authentication, private Git checkout and PHP/Node/pnpm have been verified. A directory-preserving release replaces the earlier unexecuted proposal to make public_html a symlink. Actual release results are recorded in [the November 20 record](RELEASE-2026-11-20.md).

## Local start and Git

React is at the repository root (`ScholarMatch` locally); Laravel is `backend/`. Vite builds `dist/`. The dedicated local API is `127.0.0.1:8017`, avoiding another project's port 8000. `pnpm local` verifies `/api/public/health` for the `pesomatch` identity before starting/reusing the API. Use browser origin `127.0.0.1:8443`. Accounts, APP_KEY, credentials and private files stay outside Git.

Implement/test locally, commit intended source, push to `https://github.com/TheKanjiTV/PesoMatch.git`, then pull on Hostinger. A push alone does not publish a standalone SSH checkout.

## Connect and select runtimes

```powershell
ssh pesomatch-hostinger
```

Inside Hostinger Bash:

```bash
. ~/apps/pesomatch/runtime.sh
git status --short
git pull --ff-only
php -v
node --version
pnpm --version
```

The loader selects `/opt/alt/php84/usr/bin` and `/opt/alt/alt-nodejs24/root/usr/bin`, with pinned Corepack pnpm 10.29.3. Remote builds limit Rayon/libuv workers to one to fit shared-hosting thread limits; a direct remote build succeeded with these settings. PHP 8.4.28, Node 24.22.3 and pnpm 10.29.3 were observed November 20. Its source is `deploy/hostinger-runtime.sh`. The private checkout is `/home/u636932635/apps/pesomatch/PesoMatch`. Only the user-approved public key is registered as **PesoMatch laptop**; the private key remains `~/.ssh/id_ed25519_pesomatch_hostinger` on the laptop. The alias enforces its stored host key; investigate future mismatches instead of disabling verification.

## One-time private preparation

The existing live backend was `/home/u636932635/domains/pesomatch.site/app/pesomatch`; the domain's public_html remains a real directory. Do not expose the repository, .env, storage or backups through it.

`deploy/hostinger-prepare.php` bootstraps the old production environment from explicit private paths and prepares `shared/backend.env`, private backup/migration credential files and a count/key manifest. It refuses to overwrite existing prepared state. Existing production credentials already have schema privileges; no grants are broadened. Local CRUD-only runtime permissions are unchanged. Separate migration/backup files can use dedicated identities later.

Back up the old environment/storage/tools/public files before initial publication, copy storage/tools into shared and verify the backup. Preserve APP_KEY. Never run key:generate, migrate:fresh, destructive seeders or force Git reset on an existing deployment. The new shared environment repairs the PDF extractor's stale old-domain path, pointing to the preserved private executable.

AI secrets belong only in shared/backend.env. `peso:ai-configure --check` verifies both exact models, and the release requires a complete public semantic index before switching when AI is enabled. Trial access has quotas and is not production service assurance.

## Routine reviewed release

After pushing and pulling reviewed source:

```bash
. ~/apps/pesomatch/runtime.sh
export SITE_ROOT="$HOME/apps/pesomatch"
export PUBLIC_ROOT="$HOME/domains/pesomatch.site/public_html"
export SITE_URL=https://pesomatch.site
revision=$(git rev-parse HEAD)
bash scripts/hostinger-update.sh --plan "$revision"
bash scripts/hostinger-update.sh --apply "$revision"
```

Plan is read-only. Apply uses a deployment lock and detached Git worktree under releases/<sha>, installs frozen dependencies, builds React, and creates private database/environment/public backups. It applies pending additive migrations, preserves APP_KEY/row counts, checks foreign keys and the private PDF executable, and refreshes public vacancy embeddings. Backend releases share preserved environment/storage. A private current symlink selects the backend, while public PHP/HTML entry files are replaced atomically. Older hashed assets and downloads remain. Failure after switching restores previous web entry files/backend pointer; additive migrations are not automatically reversed.

HTTP checks require the PesoMatch identity, an unauthenticated 401 session response instead of 404, a reachable AI workspace and a true 404 for missing assets. Generated CSP is translated to Apache/LiteSpeed headers, with the PHP 8.4 handler retained. Backups are private under apps/pesomatch/backups and require an operator retention policy.

Laravel cache clearing is not source synchronization. Migrate changes schema; it does not copy local records/PDFs/credentials. Deploy against current production data. The separate once-per-minute scheduler against current/backend was saved in hPanel and its command output verified; Laravel runs expiry cleanup and changed-vacancy indexing hourly. Avoid routine production source edits/commits.

## Limits

### Named frontend/backend entry points

The existing Git layout stays intact. After a release, run `SITE_ROOT="$HOME/apps/pesomatch" bash scripts/hostinger-workspace.sh`. It creates only private navigation shortcuts under `~/apps/pesomatch/workspace/`:

| Folder | Actual content |
| --- | --- |
| `source/react-frontend` | Original Git root with `src/`, `public/`, `package.json`, `.gitignore` |
| `source/laravel-backend` | The same checkout's `backend/` |
| `live/react-frontend` | Current release's built `dist/` |
| `live/laravel-backend` | Current release's operational Laravel backend |

No second clone, moved Git metadata or duplicated private storage is created. Live shortcuts follow the current release. Source shortcuts are for reviewing code; use `live/laravel-backend` for operational Artisan commands. `scripts/hostinger-visible-release.sh FULL_SHA` shows paths, Git status, `.gitignore`, runtimes and the guarded release in the user's visible SSH terminal, retaining a private release log. It never commits production edits.

Authenticated AI requires consent and a readable owner PDF for resume review. Synthetic live checks do not establish independent PESO effectiveness, physical-device support or provider intake confirmation. See [AI implementation](AI-IMPLEMENTATION.md) and [review protocol](AI-EVALUATION-PROTOCOL.md).
