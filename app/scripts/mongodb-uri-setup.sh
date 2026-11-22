#!/usr/bin/env bash
# Replaces the production MONGODB_URI on Vercel with a least-privilege user, after testing it:
# it must read and write the "margokit" database and be refused everywhere else.
# The password is typed hidden and the URI is never printed. Usage (from app/): bash scripts/mongodb-uri-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# The URI is built here from 3 answers (no manual assembly). The password is typed hidden.
read -rp "1/3 Cluster address (e.g. cluster0.ab1cd.mongodb.net): " HOST
HOST=$(printf '%s' "$HOST" | tr -d '[:space:]' | sed -E 's#^mongodb(\+srv)?://##; s#^[^@]*@##; s#[/?].*$##')
[[ "$HOST" =~ ^[a-z0-9.-]+\.mongodb\.net$ ]] || { echo "✗ The cluster address must end with .mongodb.net (Atlas → Connect → Drivers). Nothing was saved."; exit 1; }
read -rp "2/3 Database user [margokit-app]: " DBUSER
DBUSER=${DBUSER:-margokit-app}
read -rsp "3/3 Password of $DBUSER (hidden): " PASS; echo
[ -n "$PASS" ] || { echo "✗ Empty password. Nothing was saved."; exit 1; }
ENC=$(PASS="$PASS" python3 -c 'import os,urllib.parse;print(urllib.parse.quote(os.environ["PASS"],safe=""))')
URI="mongodb+srv://$DBUSER:$ENC@$HOST/margokit?retryWrites=true&w=majority&appName=margokit"

echo "Testing the user against the live cluster…"
HOST="$HOST" DBUSER="$DBUSER" ENC="$ENC" node --input-type=module -e '
import { MongoClient } from "mongodb";
// Some home routers drop DNS TXT queries and block public DNS: resolve the cluster over HTTPS
// (Cloudflare DoH) and connect with the equivalent seed list. Only for this local test —
// Vercel keeps the standard mongodb+srv URI.
const doh = async (name, type) => {
  const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, { headers: { accept: "application/dns-json" } });
  return ((await r.json()).Answer ?? []).map((a) => a.data);
};
const { HOST, DBUSER, ENC } = process.env;
const srv = (await doh(`_mongodb._tcp.${HOST}`, "SRV")).map((d) => d.split(" ")).map(([, , port, target]) => `${target.replace(/\.$/, "")}:${port}`);
const txt = (await doh(HOST, "TXT")).map((d) => d.replace(/"/g, "")).join("&");
if (!srv.length) { console.log("✗ Cluster not found: check the cluster address. Nothing was saved."); process.exit(1); }
const seed = `mongodb://${DBUSER}:${ENC}@${srv.join(",")}/margokit?tls=true&${txt}&retryWrites=true&w=majority`;
const c = new MongoClient(seed, { serverSelectionTimeoutMS: 15000 });
const fail = (m) => { console.log("✗ " + m + ". Nothing was saved."); process.exit(1); };
try { await c.connect(); } catch (e) { fail(/AtlasError|bad auth|Authentication failed/i.test(`${e.codeName} ${e.message}`) ? "Atlas refused the user/password (wrong password, or user created less than a minute ago)" : "Connection refused: " + (e.codeName || e.message).slice(0, 120)); }
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
