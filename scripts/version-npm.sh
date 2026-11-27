#!/usr/bin/env bash
# Última versión estable de cada paquete npm publicada hace al menos 14 días.
# Uso: scripts/version-npm.sh <paquete>...
set -euo pipefail
corte="$(date -u -d '14 days ago' +%Y-%m-%dT%H:%M:%S)"
for paquete in "$@"; do
  curl -fsS "https://registry.npmjs.org/${paquete/\//%2F}" | jq -r --arg c "$corte" --arg p "$paquete" '
    (.time // {}) | to_entries
    | map(select(.key | test("^[0-9]+\\.[0-9]+\\.[0-9]+$")) | select(.value < $c))
    | sort_by(.key | split(".") | map(tonumber)) | last // {key: "?", value: "?"}
    | "\($p) \(.key) \(.value[:10])"'
done
