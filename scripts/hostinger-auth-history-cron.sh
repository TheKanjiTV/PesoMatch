#!/usr/bin/env bash
# Install only authentication-session expiry tracking; preserve existing cron jobs.
set -euo pipefail
umask 077
MODE=${1:---plan}
[[ "$MODE" = --plan || "$MODE" = --apply ]] || exit 2
BACKEND="$HOME/domains/pesomatch.site/app/backend"
LOG="$HOME/apps/pesomatch/shared/storage/logs/auth-expiry-cron.log"
[[ -f "$BACKEND/artisan" && -d "$(dirname "$LOG")" ]]
JOB="* * * * * /opt/alt/php84/usr/bin/php $BACKEND/artisan peso:expire-auth-sessions --quiet >>$LOG 2>&1 # pesomatch-auth-expiry"
if ! command -v crontab >/dev/null; then
  printf 'SSH crontab is unavailable. In hPanel Cron Jobs, select Custom and schedule every minute (* * * * *):\nbash %s/scripts/hostinger-auth-expiry-run.sh\n' "$HOME/domains/pesomatch.site/app"
  [[ "$MODE" = --plan ]] && exit 0
  echo 'No cron job was installed. The hPanel entry must be created separately.' >&2
  exit 3
fi
EXISTING=$(crontab -l 2>/dev/null || true)
if [[ "$EXISTING" = *"$JOB"* ]]; then echo 'Authentication expiry cron is already configured.'; exit 0; fi
if [[ "$EXISTING" = *'# pesomatch-auth-expiry'* ]]; then echo 'A different authentication expiry job already exists; inspect before changing it.' >&2; exit 1; fi
printf 'Authentication session expiry: every minute, with existing cron jobs preserved.\n'
[[ "$MODE" = --apply ]] || exit 0
BACKUP="$HOME/apps/pesomatch/backups/crontab-before-auth-expiry-$(date -u +%Y%m%dT%H%M%SZ).txt"
printf '%s\n' "$EXISTING" > "$BACKUP"
{ [[ -z "$EXISTING" ]] || printf '%s\n' "$EXISTING"; printf '%s\n' "$JOB"; } | crontab -
crontab -l | grep -F -- '# pesomatch-auth-expiry'
