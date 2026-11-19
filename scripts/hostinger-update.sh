#!/usr/bin/env bash
set -euo pipefail
umask 077
MODE=${1:---plan}
REVISION=${2:-}
if [[ "$MODE" != --plan && "$MODE" != --apply ]] || [[ ! "$REVISION" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'Usage: SITE_ROOT=... PUBLIC_ROOT=... SITE_URL=https://... bash scripts/hostinger-update.sh --plan|--apply FULL_COMMIT_SHA' >&2; exit 2
fi
: "${SITE_ROOT:?Private application root required}"
: "${PUBLIC_ROOT:?Existing public_html directory required}"
: "${SITE_URL:?Canonical HTTPS origin required}"
[[ "$SITE_ROOT" = "$HOME"/apps/* && "$PUBLIC_ROOT" = "$HOME"/domains/*/public_html && "$SITE_URL" = https://* ]] || exit 2
SITE_ROOT=$(realpath "$SITE_ROOT"); PUBLIC_ROOT=$(realpath "$PUBLIC_ROOT")
export SITE_ROOT
REPO="$SITE_ROOT/PesoMatch"; SHARED="$SITE_ROOT/shared"; RELEASE="$SITE_ROOT/releases/$REVISION"
for executable in git php composer node pnpm rsync curl mysqldump realpath flock python3; do command -v "$executable" >/dev/null; done
[[ -d "$REPO/.git" && -d "$PUBLIC_ROOT" && ! -L "$PUBLIC_ROOT" ]]
[[ "$(git -C "$REPO" remote get-url origin)" = https://github.com/TheKanjiTV/PesoMatch.git ]]
git -C "$REPO" diff --quiet; git -C "$REPO" diff --cached --quiet
git -C "$REPO" cat-file -e "$REVISION^{commit}"
git -C "$REPO" merge-base --is-ancestor "$REVISION" origin/main
for file in backend.env mysql-backup.cnf migration.env prepared.json database-name; do [[ -s "$SHARED/$file" ]]; done
[[ -d "$SHARED/storage" && -x "$SHARED/tools/pdftotext" ]]
if [[ "$MODE" = --plan ]]; then
  printf 'Revision: %s\nPrivate release: %s\nPublic directory retained: %s\n' "$REVISION" "$RELEASE" "$PUBLIC_ROOT"
  git -C "$REPO" show --stat --oneline "$REVISION"
  echo 'Plan: build isolated release, private DB/public backups, additive migration, key/count/FK/extractor checks, shared backend symlink, retain hashed assets, atomic entry files, HTTP checks and automatic web rollback. No changes made.'
  exit 0
fi
exec 9>"$SITE_ROOT/deployment.lock"; flock -n 9 || { echo 'Another release is running.' >&2; exit 1; }
[[ ! -e "$RELEASE" ]] || { echo 'Release already exists; inspect it rather than overwriting.' >&2; exit 1; }
mkdir -p "$SITE_ROOT/releases" "$SITE_ROOT/backups"
git -C "$REPO" worktree add --detach "$RELEASE" "$REVISION"
ln -s "$SHARED/backend.env" "$RELEASE/backend/.env"
rsync -a "$RELEASE/backend/storage/" "$SHARED/storage/"
mv "$RELEASE/backend/storage" "$RELEASE/backend/storage-placeholders"
ln -s "$SHARED/storage" "$RELEASE/backend/storage"
(cd "$RELEASE/backend"; composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader; composer check-platform-reqs --no-dev)
(cd "$RELEASE"; pnpm install --frozen-lockfile; pnpm build)
BACKUP="$SITE_ROOT/backups/pre-$REVISION-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP/public_html"
cp -a "$SHARED/backend.env" "$BACKUP/backend.env"
rsync -a "$PUBLIC_ROOT/" "$BACKUP/public_html/"
PESO_DB_NAME=$(cat "$SHARED/database-name")
mysqldump --defaults-extra-file="$SHARED/mysql-backup.cnf" --single-transaction --no-tablespaces "$PESO_DB_NAME" | gzip > "$BACKUP/database.sql.gz"
gzip -t "$BACKUP/database.sql.gz"; [[ -s "$BACKUP/database.sql.gz" ]]
# Capture fresh row counts immediately before migration; preserve original key hash.
(cd "$RELEASE/backend"; php -r 'require "vendor/autoload.php";$a=require "bootstrap/app.php";$a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();$p=getenv("SITE_ROOT")."/shared/prepared.json";$m=json_decode(file_get_contents($p),true);foreach(array_keys($m["protected_counts"])as$t)$m["protected_counts"][$t]=Illuminate\Support\Facades\DB::table($t)->count();file_put_contents($p,json_encode($m,JSON_PRETTY_PRINT));')
(cd "$RELEASE/backend"; set -a; source "$SHARED/migration.env"; set +a; php artisan migrate --force)
(cd "$RELEASE/backend"; php artisan optimize:clear; php artisan config:cache; php artisan route:cache; php artisan view:cache; php "$RELEASE/deploy/hostinger-verify.php")
# Optional first-release model setup has already been validated through --check.
# Never publish a partial semantic catalog. Index failures keep the old web release.
if (cd "$RELEASE/backend"; php -r 'require "vendor/autoload.php";$a=require "bootstrap/app.php";$a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();exit(app(App\Services\AiProvider::class)->configured()?0:1);'); then
  (cd "$RELEASE/backend"; php artisan peso:ai-configure --check; php artisan peso:ai-index)
fi
# Confirm PHP web-SAPI can load this private release before changing the live entry.
PROBE_DIRECTORY="$PUBLIC_ROOT/.well-known/peso-stage-$REVISION"
mkdir -p "$PROBE_DIRECTORY"; chmod 755 "$PUBLIC_ROOT/.well-known" "$PROBE_DIRECTORY"
python3 - "$RELEASE" "$PROBE_DIRECTORY/index.php" <<'PY'
from pathlib import Path
import sys
release, target = map(Path, sys.argv[1:])
code = "<?php\nrequire "+repr(str(release/'backend/vendor/autoload.php'))+";\n$app=require "+repr(str(release/'backend/bootstrap/app.php'))+";\n$kernel=$app->make(Illuminate\\Contracts\\Http\\Kernel::class);$response=$kernel->handle(Illuminate\\Http\\Request::create('/api/public/health'));$response->send();\n"
target.write_text(code)
PY
chmod 644 "$PROBE_DIRECTORY/index.php"
if ! probe=$(curl --fail --silent --show-error --max-time 25 "$SITE_URL/.well-known/peso-stage-$REVISION/index.php"); then
  rm -f -- "$PROBE_DIRECTORY/index.php"; rmdir -- "$PROBE_DIRECTORY"; echo 'Staged web-SAPI probe failed; previous live mapping retained.' >&2; exit 1
fi
rm -f -- "$PROBE_DIRECTORY/index.php"; rmdir -- "$PROBE_DIRECTORY"
[[ "$probe" = *'"application":"pesomatch"'* ]] || { echo 'Staged backend identity mismatch; live mapping retained.' >&2; exit 1; }
OLD_CURRENT=$(readlink "$SITE_ROOT/current" || true)
WEB_CHANGED=0
rollback() {
  status=$?
  if [[ "$WEB_CHANGED" = 1 ]]; then
    if [[ -n "$OLD_CURRENT" ]]; then ln -s "$OLD_CURRENT" "$SITE_ROOT/current.rollback"; mv -Tf "$SITE_ROOT/current.rollback" "$SITE_ROOT/current"; fi
    # Retain newly uploaded hashed assets; restore the previous entry files/config.
    for file in index.php index.html sw.js manifest.webmanifest offline.html .htaccess; do
      if [[ -f "$BACKUP/public_html/$file" ]]; then cp "$BACKUP/public_html/$file" "$PUBLIC_ROOT/$file.rollback"; chmod 644 "$PUBLIC_ROOT/$file.rollback"; mv -f "$PUBLIC_ROOT/$file.rollback" "$PUBLIC_ROOT/$file"; fi
    done
    echo 'Web entry files restored; DB backup retained. Additive migrations were not reversed.' >&2
  fi
  exit "$status"
}
trap rollback ERR
# Stage static content first; no --delete means older hashed assets and downloads survive.
rsync -a --exclude=index.html --exclude=sw.js --exclude=manifest.webmanifest --exclude=offline.html --exclude=.htaccess "$RELEASE/dist/" "$PUBLIC_ROOT/"
find "$PUBLIC_ROOT" -type d -exec chmod 755 {} +
find "$PUBLIC_ROOT" -type f -exec chmod 644 {} +
python3 - "$RELEASE" "$PUBLIC_ROOT" "$SITE_ROOT" <<'PY'
import re,sys
from pathlib import Path
release,public,root=map(Path,sys.argv[1:])
configuration=(release/'deploy/hostinger-public.htaccess').read_text()
policy=re.search(r'add_header Content-Security-Policy "([^"]+)" always;', (release/'dist/security-headers.conf').read_text()).group(1)
configuration+='\n<IfModule mod_headers.c>\n<FilesMatch "^(index|offline)\\.html$">\nHeader always set Content-Security-Policy "'+policy+'"\n</FilesMatch>\n</IfModule>\n'
(public/'.htaccess.next').write_text(configuration)
(public/'index.php.next').write_text("<?php\nrequire "+repr(str(release/'backend/public/index.php'))+";\n")
PY
WEB_CHANGED=1
ln -s "$RELEASE" "$SITE_ROOT/current.next"; mv -Tf "$SITE_ROOT/current.next" "$SITE_ROOT/current"
for file in .htaccess index.php; do chmod 644 "$PUBLIC_ROOT/$file.next"; mv -f "$PUBLIC_ROOT/$file.next" "$PUBLIC_ROOT/$file"; done
for file in index.html offline.html manifest.webmanifest sw.js; do
  if [[ -f "$RELEASE/dist/$file" ]]; then cp "$RELEASE/dist/$file" "$PUBLIC_ROOT/$file.next"; chmod 644 "$PUBLIC_ROOT/$file.next"; mv -f "$PUBLIC_ROOT/$file.next" "$PUBLIC_ROOT/$file"; fi
done
health=$(curl --fail --silent --show-error --max-time 25 "$SITE_URL/api/public/health")
[[ "$health" = *'"application":"pesomatch"'* ]]
[[ "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 25 -H 'Accept: application/json' "$SITE_URL/api/auth/user")" = 401 ]]
curl --fail --silent --show-error --max-time 25 "$SITE_URL/ai-workspace" >/dev/null
[[ "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 25 "$SITE_URL/assets/nonexistent-deployment-check.js")" = 404 ]]
trap - ERR
printf 'Released %s. Backup: %s. Backend identity, session route, SPA and missing-asset HTTP checks passed.\n' "$REVISION" "$BACKUP"
