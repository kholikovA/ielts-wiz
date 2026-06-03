#!/usr/bin/env bash
# Push this vendored (canonical) copy of the reading-test skill back into the
# global Claude skill dir, so the live skill matches what's version-controlled.
# Run after editing build_test.py / template.html / the docs here.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL="${HOME}/.claude/skills/html-ielts-reading-test"

if [ ! -d "$GLOBAL" ]; then
  echo "Global skill dir not found: $GLOBAL"
  echo "Creating it."
  mkdir -p "$GLOBAL/scripts" "$GLOBAL/assets" "$GLOBAL/references"
fi

cp "$HERE/scripts/build_test.py"      "$GLOBAL/scripts/build_test.py"
cp "$HERE/assets/template.html"       "$GLOBAL/assets/template.html"
cp "$HERE/references/spec_format.md"  "$GLOBAL/references/spec_format.md"
cp "$HERE/SKILL.md"                   "$GLOBAL/SKILL.md"

echo "Synced vendored reading-test skill -> $GLOBAL"
