#!/usr/bin/env bash
# Replaces the production MONGODB_URI on Vercel with a least-privilege user, after testing it:
# it must read and write the "margokit" database and be refused everywhere else.
# The URI is typed hidden and never printed. Usage (from app/): bash scripts/mongodb-uri-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

read -rsp "New MONGODB_URI (hidden): " URI; echo
URI=$(printf '%s' "$URI" | tr -d '[:space:]')
if [[ ! "$URI" =~ ^mongodb\+srv://[^:/@]+:[^@]+@[^/]+/margokit(\?.*)?$ ]]; then
  echo "✗ Expected mongodb+srv://USER:PASSWORD@cluster…mongodb.net/margokit?retryWrites=true&w=majority"
  echo "  (check that /margokit is right before the ?). Nothing was saved."
  exit 1
fi

echo "Testing the user against the live cluster…"
MONGODB_URI="$URI" node --input-type=module -e '
import { MongoClient } from "mongodb";
const c = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const fail = (m) => { console.log("✗ " + m + ". Nothing was saved."); process.exit(1); };
try { await c.connect(); } catch (e) { fail("Connection refused: " + (e.codeName || e.message).slice(0, 120)); }
const db = c.db();
if (db.databaseName !== "margokit") fail("The URI must point to the margokit database");
const users = await db.collection("user").countDocuments().catch((e) => fail("Cannot read margokit: " + e.codeName));
// Write test in a throwaway collection, removed right away
const probe = db.collection("_permission_probe");
await probe.insertOne({ at: new Date() }).catch((e) => fail("Cannot write to margokit: " + e.codeName));
await probe.drop().catch(() => undefined);
// Must be refused outside margokit
const other = await c.db("margokit_probe_other").collection("x").insertOne({ x: 1 }).then(() => true, () => false);
if (other) { await c.db("margokit_probe_other").dropDatabase().catch(() => undefined); fail("This user can write to OTHER databases: give it readWrite on margokit only"); }
console.log("✓ Reads margokit (" + users + " accounts), writes margokit, refused elsewhere");
await c.close();
' 

printf '%s' "$URI" | vercel env add MONGODB_URI production --sensitive --force >/dev/null 2>&1 && echo "✓ MONGODB_URI saved on Vercel (production)"
echo "Done. Ask Claude to redeploy and check the site. Keep the old Atlas user until then (rollback)."
