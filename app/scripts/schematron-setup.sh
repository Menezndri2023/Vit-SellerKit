#!/usr/bin/env bash
# Downloads the official validation rules used by src/lib/einvoice/einvoice.schematron.test.ts
# into app/.schematron (gitignored). Needs curl, unzip and Java 11+. Usage: npm run schematron:setup
set -euo pipefail
cd "$(dirname "$0")/.."
EN=1.3.17          # CEN EN 16931 validation artefacts — https://github.com/ConnectingEurope/eInvoicing-EN16931/releases
PEPPOL=3.0.22      # Peppol BIS Billing 3.0 — https://github.com/OpenPEPPOL/peppol-bis-invoice-3
SAXON=9.9.1-8      # Saxon-HE (XSLT 2.0/3.0), Maven Central
SCHXSLT=1.10.1     # SchXslt: compiles Peppol's .sch into XSLT, Maven Central
D=.schematron; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$D/peppol"
curl -fsSL -o "$D/saxon.jar" "https://repo1.maven.org/maven2/net/sf/saxon/Saxon-HE/$SAXON/Saxon-HE-$SAXON.jar"
for f in cii ubl; do
  curl -fsSL -o "$T/$f.zip" "https://github.com/ConnectingEurope/eInvoicing-EN16931/releases/download/validation-$EN/en16931-$f-$EN.zip"
  rm -rf "$D/$f" && unzip -q "$T/$f.zip" -d "$D/$f"
done
curl -fsSL -o "$T/schxslt.jar" "https://repo1.maven.org/maven2/name/dmaus/schxslt/schxslt/$SCHXSLT/schxslt-$SCHXSLT.jar"
unzip -q "$T/schxslt.jar" -d "$T/schxslt"
curl -fsSL -o "$T/peppol.sch" "https://raw.githubusercontent.com/OpenPeppol/peppol-bis-invoice-3/$PEPPOL/rules/sch/PEPPOL-EN16931-UBL.sch"
java -jar "$D/saxon.jar" -s:"$T/peppol.sch" -xsl:"$T/schxslt/xslt/2.0/pipeline-for-svrl.xsl" -o:"$D/peppol/PEPPOL-EN16931-UBL.xslt"
echo "Schematron rules ready in $D (EN 16931 $EN, Peppol BIS $PEPPOL). Run: npm test"
