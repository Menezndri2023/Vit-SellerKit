#!/usr/bin/env bash
# Subscribes Margokit's webhook to Gumroad's refund / dispute / cancellation / subscription events,
# so a refund or a cancellation is reflected immediately (not only at the daily re-check).
# Run it yourself: the Gumroad access token is typed in hidden, the Ping secret is never printed. Idempotent: existing subscriptions to the same URL are kept, not duplicated.
# Usage (from app/): bash scripts/gumroad-subscriptions.sh
set -euo pipefail
cd "$(dirname "$0")/.."
API=https://api.gumroad.com/v2
SITE=${SITE:-https://margokit.com}
RESOURCES="refund dispute dispute_won cancellation subscription_updated subscription_ended subscription_restarted"

read -rsp "Gumroad access token (hidden): " TOKEN; echo
[ -n "$TOKEN" ] || { echo "No token"; exit 1; }

# The Ping secret: $GUMROAD_PING_SECRET, else ../private/margokit-pro.env (setup file, never committed).
# (Vercel can't give it back: production variables are "sensitive" and can't be read after creation.)
SECRET=${GUMROAD_PING_SECRET:-}
ENV_FILE=../private/margokit-pro.env
if [ -z "$SECRET" ] && [ -f "$ENV_FILE" ]; then SECRET=$(grep '^GUMROAD_PING_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d "\"'"); fi
[ -n "$SECRET" ] || { echo "Ping secret not found: run with GUMROAD_PING_SECRET=… (Gumroad → Settings → Advanced → Ping URL, last part)"; exit 1; }
URL="$SITE/api/webhooks/gumroad/$SECRET"
# Check the URL against the live site without side effects: a non-form body answers 400 with the
# right secret (request rejected before anything is stored), 404 with a wrong one.
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: text/plain' --data 'check' "$URL")
[ "$CODE" = "400" ] || { echo "The Ping secret doesn't match $SITE (HTTP $CODE): nothing changed"; exit 1; }

for R in $RESOURCES; do
  EXISTING=$(curl -fsS "$API/resource_subscriptions" -G --data-urlencode "access_token=$TOKEN" --data-urlencode "resource_name=$R" \
    | python3 -c "import json,sys;u=sys.argv[1];print(sum(1 for s in json.load(sys.stdin).get('resource_subscriptions',[]) if s.get('post_url')==u))" "$URL")
  if [ "$EXISTING" != "0" ]; then echo "✓ $R (already subscribed)"; continue; fi
  OK=$(curl -fsS -X PUT "$API/resource_subscriptions" --data-urlencode "access_token=$TOKEN" --data-urlencode "resource_name=$R" --data-urlencode "post_url=$URL" \
    | python3 -c "import json,sys;print(json.load(sys.stdin).get('success'))")
  [ "$OK" = "True" ] && echo "✓ $R subscribed" || { echo "✗ $R failed"; exit 1; }
done
echo "Done: Gumroad will notify $SITE/api/webhooks/gumroad/…${SECRET: -4} for: $RESOURCES"
