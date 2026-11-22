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
TOKEN=$(printf '%s' "$TOKEN" | tr -d '[:space:]')   # pasted tokens often carry a space or a newline
[ -n "$TOKEN" ] || { echo "No token"; exit 1; }

# api METHOD PATH [curl args…] → prints the JSON body; exits with Gumroad's own message on error
api() {
  local method=$1 path=$2; shift 2
  local out code
  out=$(curl -sS -X "$method" -w '\n%{http_code}' "$API$path" --data-urlencode "access_token=$TOKEN" "$@") || { echo "Network error calling Gumroad" >&2; exit 1; }
  code=${out##*$'\n'}; out=${out%$'\n'*}
  if [ "$code" != "200" ]; then
    echo "Gumroad answered HTTP $code on $path: $(printf '%s' "$out" | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("message","(no message)"))
except Exception: print("(not JSON)")')" >&2
    exit 1
  fi
  printf '%s' "$out"
}

# 1. The token itself (any valid token can read the profile)
if ! PROFILE=$(api GET /user -G); then
  echo "→ The token was refused. In Gumroad → Settings → Advanced → Applications → your application,"
  echo "  copy the value shown after clicking \"Generate access token\" (not the Application ID or secret)."
  exit 1
fi
echo "Token OK for Gumroad account: $(printf '%s' "$PROFILE" | python3 -c 'import json,sys;u=json.load(sys.stdin).get("user",{});print(u.get("name") or u.get("email") or "?")')"

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
  LIST=$(api GET /resource_subscriptions -G --data-urlencode "resource_name=$R") || { echo "→ If the token works but this fails, the application needs the view_sales permission."; exit 1; }
  EXISTING=$(printf '%s' "$LIST" | python3 -c "import json,sys;u=sys.argv[1];print(sum(1 for s in json.load(sys.stdin).get('resource_subscriptions',[]) if s.get('post_url')==u))" "$URL")
  if [ "$EXISTING" != "0" ]; then echo "✓ $R (already subscribed)"; continue; fi
  OK=$(api PUT /resource_subscriptions --data-urlencode "resource_name=$R" --data-urlencode "post_url=$URL" \
    | python3 -c "import json,sys;print(json.load(sys.stdin).get('success'))")
  [ "$OK" = "True" ] && echo "✓ $R subscribed" || { echo "✗ $R failed"; exit 1; }
done
echo "Done: Gumroad will notify $SITE/api/webhooks/gumroad/…${SECRET: -4} for: $RESOURCES"
