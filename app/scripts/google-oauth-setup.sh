#!/usr/bin/env bash
# Saves the Google sign-in credentials on Vercel (production), after checking each value's format,
# so the client ID and the client secret can't be swapped. The secret is typed hidden.
# Usage (from app/): bash scripts/google-oauth-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

read -rp "1/2 Client ID (ends with .apps.googleusercontent.com): " ID
ID=$(printf '%s' "$ID" | tr -d '[:space:]')
if [[ ! "$ID" =~ ^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$ ]]; then
  echo "✗ This is not a client ID. It must look like 123456789012-abc123….apps.googleusercontent.com"
  [[ "$ID" == GOCSPX-* ]] && echo "  (you pasted the client SECRET: nothing was saved)"
  exit 1
fi

read -rsp "2/2 Client secret (starts with GOCSPX-, hidden): " SECRET; echo
SECRET=$(printf '%s' "$SECRET" | tr -d '[:space:]')
if [[ ! "$SECRET" =~ ^GOCSPX-[A-Za-z0-9_-]{20,}$ ]]; then
  echo "✗ This is not a client secret (it must start with GOCSPX-). Nothing was saved."
  exit 1
fi

printf '%s' "$ID" | vercel env add GOOGLE_CLIENT_ID production --force >/dev/null 2>&1 && echo "✓ GOOGLE_CLIENT_ID saved"
printf '%s' "$SECRET" | vercel env add GOOGLE_CLIENT_SECRET production --sensitive --force >/dev/null 2>&1 && echo "✓ GOOGLE_CLIENT_SECRET saved"
vercel env ls production 2>/dev/null | grep -q GOOGLE_CLIENT_ID && vercel env ls production 2>/dev/null | grep -q GOOGLE_CLIENT_SECRET \
  && echo "Done. Ask Claude to redeploy and check the sign-in." || { echo "✗ Vercel did not confirm both variables"; exit 1; }
