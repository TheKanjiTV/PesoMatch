#!/usr/bin/env bash
set -euo pipefail
# Read-only inventory. Run after verifying the SSH host fingerprint in hPanel.
printf 'Account directory: '; pwd
printf '\nRuntime commands:\n'
for cmd in git php composer node pnpm curl rsync mysqldump; do command -v "$cmd" || true; done
php -v | head -n 2
composer --version
if command -v node >/dev/null; then node --version; fi
if command -v pnpm >/dev/null; then pnpm --version; fi
printf '\nAvailable PHP binaries:\n'
for phpbin in /opt/alt/php{82,83,84,85}/usr/bin/php; do
  if [[ -x "$phpbin" ]]; then "$phpbin" -r 'echo PHP_BINARY," ",PHP_VERSION,PHP_EOL;'; fi
done
printf '\nDomain directories (no file contents or secrets):\n'
if [[ -d "$HOME/domains" ]]; then find "$HOME/domains" -maxdepth 2 -type d -name public_html -print; fi
printf '\nConfirm actual domain/document-root and PHP web version in hPanel.\n'
