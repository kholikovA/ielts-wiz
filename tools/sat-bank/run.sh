#!/bin/bash
# Turn College Board question bank PDF exports into an import folder for the hub's
# Teaching → Question bank → Import (bank.json + img/). macOS only (PDFKit + swiftc).
#
#   tools/sat-bank/run.sh ~/Downloads/sat-question-bank ~/Downloads/questionbank-export-*.pdf
#
# Questions are keyed by their College Board Question ID; importing again adds new IDs
# and updates existing ones. Output also prints any answer it had to take from the
# rationale, and the extraction checks (see parse.py / build.py).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$1"; shift
export SAT_WORK="$(mktemp -d)"
mkdir -p "$SAT_WORK/qb" "$SAT_WORK/bank/img"
swiftc -O "$HERE/bands.swift" -o "$SAT_WORK/bands" 2>/dev/null
swiftc -O "$HERE/crops.swift" -o "$SAT_WORK/crops" 2>/dev/null
i=0
for pdf in "$@"; do
  cp "$pdf" "$SAT_WORK/qb/p$i.pdf"
  "$SAT_WORK/bands" "$SAT_WORK/qb/p$i.pdf" "$SAT_WORK/qb/p$i.bands.json" 2>/dev/null
  i=$((i+1))
done
python3 "$HERE/parse.py"
python3 "$HERE/build.py"
(cd "$SAT_WORK/bank" && "$SAT_WORK/crops" jobs.json 2 2>/dev/null)
ls "$SAT_WORK/bank/img" | grep 'raw$' | sed "s#^#$SAT_WORK/bank/img/#" | xargs -n 400 -P 6 python3 "$HERE/pack.py"
python3 "$HERE/package.py" "$OUT"
echo "Import folder: $OUT"
