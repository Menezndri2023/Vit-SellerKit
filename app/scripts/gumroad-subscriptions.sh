#!/usr/bin/env bash
# Subscribes Margokit's webhook to Gumroad's refund / dispute / cancellation / subscription events,
# so a refund or a cancellation is reflected immediately (not only at the daily re-check).
# Run it yourself: the Gumroad access token is typed in hidden, the Ping secret is read from Vercel
# and never printed. Idempotent: existing subscriptions to the same URL are kept, not duplicated.
# Usage (from app/): bash scripts/gumroad-subscriptions.sh
set -euo pipefail
cd "$(dirname "$0")/.."
API=https://api.gumroad.com/v2
SITE=${SITE:-https://margokit.com}
RESOURCES="refund dispute dispute_won cancellation subscription_updated subscription_ended subscription_restarted"

read -rsp "Gumroad access token (hidden): " TOKEN; echo
[ -n "$TOKEN" ] || { echo "No token"; exit 1; }

TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT
vercel env pull --environment=production --yes "$TMP" >/dev/null 2>&1
SECRET=$(grep '^GUMROAD_PING_SECRET=' "$TMP" | cut -d= -f2- | tr -d '"')
rm -f "$TMP"
[ -n "$SECRET" ] || { echo "GUMROAD_PING_SECRET not found on Vercel (production)"; exit 1; }
URL="$SITE/api/webhooks/gumroad/$SECRET"

for R in $RESOURCES; do
  EXISTING=$(curl -fsS "$API/resource_subscriptions" -G --data-urlencode "access_token=$TOKEN" --data-urlencode "resource_name=$R" \
    | python3 -c "import json,sys;u=sys.argv[1];print(sum(1 for s in json.load(sys.stdin).get('resource_subscriptions',[]) if s.get('post_url')==u))" "$URL")
  if [ "$EXISTING" != "0" ]; then echo "✓ $R (already subscribed)"; continue; fi
  OK=$(curl -fsS -X PUT "$API/resource_subscriptions" --data-urlencode "access_token=$TOKEN" --data-urlencode "resource_name=$R" --data-urlencode "post_url=$URL" \
    | python3 -c "import json,sys;print(json.load(sys.stdin).get('success'))")
  [ "$OK" = "True" ] && echo "✓ $R subscribed" || { echo "✗ $R failed"; exit 1; }
done
echo "Done: Gumroad will notify $SITE/api/webhooks/gumroad/…${SECRET: -4} for: $RESOURCES"
