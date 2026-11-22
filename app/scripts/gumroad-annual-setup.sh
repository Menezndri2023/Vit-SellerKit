#!/usr/bin/env bash
# Checks the Gumroad products (lifetime at the expected price, annual membership present) and saves
# the annual offer settings on Vercel (production). Token typed hidden. Usage (from app/):
#   bash scripts/gumroad-annual-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
EXPECTED_LIFETIME=${EXPECTED_LIFETIME:-99}
EXPECTED_ANNUAL=${EXPECTED_ANNUAL:-49}

read -rsp "Gumroad access token (hidden): " TOKEN; echo
TOKEN=$(printf '%s' "$TOKEN" | tr -d '[:space:]')
JSON=$(curl -sS -G https://api.gumroad.com/v2/products --data-urlencode "access_token=$TOKEN") || { echo "Network error"; exit 1; }

RESULT=$(GUMROAD_JSON="$JSON" EXPECTED_LIFETIME="$EXPECTED_LIFETIME" python3 - <<'PY'
import json, os
d = json.loads(os.environ.get("GUMROAD_JSON") or "{}")
if not d.get("success"):
    print("ERROR " + str(d.get("message", "token refused")))
    raise SystemExit
def usd(p):
    return (p.get("price") or 0) / 100
products = d.get("products", [])
print("INFO Your Gumroad products:")
for p in products:
    dur = p.get("subscription_duration") or ("membership" if p.get("is_tiered_membership") else "one-off")
    print("INFO   - %s | %s | %s | %s" % (p.get("name"), p.get("formatted_price") or usd(p), dur, p.get("short_url")))
life = [p for p in products if "lifetime" in (p.get("name") or "").lower()]
ann = [p for p in products if p.get("subscription_duration") == "yearly" or any(w in (p.get("name") or "").lower() for w in ("annual", "annuel", "yearly"))]
expected = float(os.environ["EXPECTED_LIFETIME"])
if life:
    lp = usd(life[0])
    if abs(lp - expected) > 0.001:
        print("WARN Lifetime product is at %g $ on Gumroad, expected %g $: change it before the site shows the new price." % (lp, expected))
    else:
        print("OK Lifetime product at %g $" % lp)
if len(ann) != 1:
    print("ERROR Found %d annual product(s): create exactly one Membership with a yearly price (name containing Annual)." % len(ann))
    raise SystemExit
a = ann[0]
print("ANNUAL %s %s %g" % (a["id"], a.get("short_url"), usd(a)))
PY
)

printf '%s\n' "$RESULT" | grep -E '^(INFO|OK|WARN)' | sed -E 's/^(INFO|OK|WARN) ?//' || true
if printf '%s\n' "$RESULT" | grep -q '^ERROR'; then printf '%s\n' "$RESULT" | grep '^ERROR' | sed 's/^ERROR /✗ /'; exit 1; fi
read -r _ ID URL PRICE <<< "$(printf '%s\n' "$RESULT" | grep '^ANNUAL')"
[ "${PRICE%.*}" = "$EXPECTED_ANNUAL" ] || echo "⚠ Annual product price on Gumroad: $PRICE \$ (expected $EXPECTED_ANNUAL \$). The site will show $PRICE \$."
echo
echo "Annual product: $URL (price $PRICE \$)"
read -rp "Save it on Vercel and show the annual offer? [y/N] " OK
[ "$OK" = "y" ] || [ "$OK" = "Y" ] || { echo "Nothing saved."; exit 0; }
printf '%s' "$ID" | vercel env add GUMROAD_PRODUCT_ID_ANNUAL production --force >/dev/null 2>&1 && echo "✓ GUMROAD_PRODUCT_ID_ANNUAL"
printf '%s' "$URL" | vercel env add GUMROAD_URL_ANNUAL production --force >/dev/null 2>&1 && echo "✓ GUMROAD_URL_ANNUAL"
printf '%s' "${PRICE%.*}" | vercel env add GUMROAD_PRICE_ANNUAL_USD production --force >/dev/null 2>&1 && echo "✓ GUMROAD_PRICE_ANNUAL_USD"
echo "Done. Ask Claude to deploy."
