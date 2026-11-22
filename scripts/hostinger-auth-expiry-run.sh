#!/usr/bin/env bash
# Use this private runner as an hPanel Custom cron command when SSH has no crontab.
set -euo pipefail
cd "$HOME/domains/pesomatch.site/app/backend"
exec /opt/alt/php84/usr/bin/php artisan peso:expire-auth-sessions --quiet >>"$HOME/apps/pesomatch/shared/storage/logs/auth-expiry-cron.log" 2>&1
