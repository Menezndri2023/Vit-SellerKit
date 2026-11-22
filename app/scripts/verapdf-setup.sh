#!/usr/bin/env bash
# Installs veraPDF (reference PDF/A validator) into app/.verapdf (gitignored), headless.
# Used by src/lib/einvoice/einvoice.pdfa.test.ts. Needs curl, unzip and Java 11+. Usage: npm run verapdf:setup
set -euo pipefail
cd "$(dirname "$0")/.."
D="$PWD/.verapdf"; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
curl -fsSL -o "$T/installer.zip" https://software.verapdf.org/releases/verapdf-installer.zip
unzip -q "$T/installer.zip" -d "$T"
JAR=$(find "$T" -name 'verapdf-izpack-installer-*.jar' | head -1)
cat > "$T/auto.xml" <<XML
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<AutomatedInstallation langpack="eng">
  <com.izforge.izpack.panels.htmlhello.HTMLHelloPanel id="welcome"/>
  <com.izforge.izpack.panels.target.TargetPanel id="install_dir"><installpath>$D</installpath></com.izforge.izpack.panels.target.TargetPanel>
  <com.izforge.izpack.panels.packs.PacksPanel id="sdk_pack_select">
    <pack index="0" name="veraPDF GUI" selected="true"/>
    <pack index="1" name="veraPDF Batch files" selected="true"/>
    <pack index="2" name="veraPDF Validation model" selected="false"/>
    <pack index="3" name="veraPDF Documentation" selected="false"/>
    <pack index="4" name="veraPDF Sample Plugins" selected="false"/>
  </com.izforge.izpack.panels.packs.PacksPanel>
  <com.izforge.izpack.panels.install.InstallPanel id="install"/>
  <com.izforge.izpack.panels.finish.FinishPanel id="finish"/>
</AutomatedInstallation>
XML
rm -rf "$D" && java -jar "$JAR" "$T/auto.xml" >/dev/null
"$D/verapdf" --version | head -1
